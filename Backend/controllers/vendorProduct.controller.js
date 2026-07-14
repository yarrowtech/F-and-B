import mongoose from "mongoose";
import Restaurant from "../models/Restaurant.model.js";
import Vendor from "../models/Vendor.model.js";
import VendorProduct from "../models/VendorProduct.model.js";
import { configureCloudinary } from "../config/cloudinary.js";

const toObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(value) ? new mongoose.Types.ObjectId(value) : null;

const getAdminRestaurantIds = async (adminId) => {
  if (!adminId) return [];

  const restaurantIds = await Restaurant.find({ admin: adminId }).distinct("_id");
  return restaurantIds.map((id) => id.toString());
};

const getVendorRestaurantIds = (vendor) => {
  const restaurants = vendor?.accessibleRestaurants?.length
    ? vendor.accessibleRestaurants
    : [vendor?.primaryRestaurant].filter(Boolean);

  return [...new Set(restaurants.map((restaurant) => String(restaurant?._id || restaurant)))];
};

const normalizePositiveNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const getErrorMessage = (error, fallback = "Something went wrong") => {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  if (typeof error.message === "string" && error.message.trim()) {
    return error.message;
  }
  if (
    error.message &&
    typeof error.message === "object" &&
    typeof error.message.message === "string" &&
    error.message.message.trim()
  ) {
    return error.message.message;
  }
  if (typeof error.error?.message === "string" && error.error.message.trim()) {
    return error.error.message;
  }

  try {
    return JSON.stringify(error.message || error);
  } catch {
    return fallback;
  }
};

const hasCloudinaryConfig = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );

const isSupportedImageDataUrl = (value) =>
  /^data:image\/(png|jpe?g|webp);base64,/i.test(String(value || "").trim());

const uploadProductImage = async ({ imageDataUrl, vendorId }) => {
  if (!isSupportedImageDataUrl(imageDataUrl)) {
    throw new Error("Product image must be PNG, JPG, JPEG, or WEBP");
  }

  const normalizedImageDataUrl = String(imageDataUrl).trim();

  if (!hasCloudinaryConfig()) {
    return {
      imageUrl: normalizedImageDataUrl,
      imagePublicId: "",
    };
  }

  const cloudinary = configureCloudinary();

  try {
    const uploaded = await cloudinary.uploader.upload(normalizedImageDataUrl, {
      folder: `efnbmms/vendor-products/${vendorId}`,
      resource_type: "image",
    });

    return {
      imageUrl: uploaded.secure_url || "",
      imagePublicId: uploaded.public_id || "",
    };
  } catch (error) {
    console.error("Cloudinary upload failed, saving inline image instead.", {
      vendorId,
      message: getErrorMessage(error),
      http_code: error?.http_code,
      name: error?.name,
    });

    return {
      imageUrl: normalizedImageDataUrl,
      imagePublicId: "",
    };
  }
};

const removeProductImage = async (publicId) => {
  if (!publicId || !hasCloudinaryConfig()) return;
  const cloudinary = configureCloudinary();
  await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
};

const normalizeConversionFactor = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

const getStockUnit = (product) => String(product.stockUnit || product.unit || "").trim();
const getOrderUnit = (product) => String(product.unit || product.stockUnit || "").trim();
const getOrderUnitsPerStockUnit = (product) =>
  normalizeConversionFactor(product.orderUnitsPerStockUnit);
const getOrderPackQuantity = (product) =>
  normalizeConversionFactor(product.orderPackQuantity);
const getDisplayUnit = (product) => {
  const quantity = getOrderPackQuantity(product);
  const unit = getOrderUnit(product);
  return quantity === 1 ? unit : `${quantity} ${unit}`.trim();
};
const getAvailableOrderQuantity = (product) =>
  Math.max(
    0,
    Math.floor(
      (normalizePositiveNumber(product.stock) * getOrderUnitsPerStockUnit(product)) /
        getOrderPackQuantity(product)
    )
  );
const getWeightedAverageBuyingPrice = ({
  currentStock,
  currentBuyingPrice,
  addedQuantity,
  addedBuyingPrice,
}) => {
  const safeCurrentStock = normalizePositiveNumber(currentStock);
  const safeCurrentBuyingPrice = normalizePositiveNumber(currentBuyingPrice);
  const safeAddedQuantity = normalizePositiveNumber(addedQuantity);
  const safeAddedBuyingPrice = normalizePositiveNumber(addedBuyingPrice);

  const totalQuantity = safeCurrentStock + safeAddedQuantity;
  if (totalQuantity <= 0) return 0;

  const totalValue =
    safeCurrentStock * safeCurrentBuyingPrice + safeAddedQuantity * safeAddedBuyingPrice;

  return Number((totalValue / totalQuantity).toFixed(6));
};

const buildProductResponse = (product, viewerRole = "vendor") => {
  const availableOrderQuantity = getAvailableOrderQuantity(product);
  const orderUnit = getOrderUnit(product);
  const stockUnit = getStockUnit(product);
  const orderPackQuantity = getOrderPackQuantity(product);

  return {
    id: product._id,
    _id: product._id,
    vendor: product.vendor,
    name: product.name,
    description: product.description,
    price: product.price,
    buyingPrice: normalizePositiveNumber(product.buyingPrice, normalizePositiveNumber(product.price)),
    unit: orderUnit,
    displayUnit: getDisplayUnit(product),
    orderUnit,
    stockUnit,
    orderUnitsPerStockUnit: getOrderUnitsPerStockUnit(product),
    orderPackQuantity,
    category: product.category,
    imageUrl: product.imageUrl || "",
    stock: viewerRole === "vendor" ? normalizePositiveNumber(product.stock) : undefined,
    lowStockThreshold:
      viewerRole === "vendor"
        ? normalizePositiveNumber(product.lowStockThreshold, 10)
        : undefined,
    availableOrderQuantity,
    isActive: product.isActive,
    isForSale: Boolean(product.isForSale),
    isListedInMyProducts: Boolean(product.isListedInMyProducts) || Boolean(product.isForSale),
    canSell: Boolean(product.isActive) && Boolean(product.isForSale) && availableOrderQuantity > 0,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
};

const canViewVendorProducts = async (req, vendorId) => {
  if (req.user.role === "super_admin") return true;

  if (req.user.role === "vendor") {
    return String(req.user.id) === String(vendorId);
  }

  if (req.user.role === "admin") {
    const vendor = await Vendor.findById(vendorId).select(
      "createdByAdmin connectedAdmins upgradedFromVendor primaryRestaurant accessibleRestaurants"
    );
    if (!vendor) return false;

    if (String(vendor.createdByAdmin || "") === String(req.user.id)) {
      return true;
    }

    if (vendor.connectedAdmins?.some((adminId) => String(adminId) === String(req.user.id))) {
      return true;
    }

    if (!vendor.upgradedFromVendor) {
      const adminRestaurantIds = await getAdminRestaurantIds(req.user.id);
      return getVendorRestaurantIds(vendor).some((id) => adminRestaurantIds.includes(id));
    }

    const sourceVendor = await Vendor.findById(vendor.upgradedFromVendor).select(
      "createdByAdmin connectedAdmins primaryRestaurant accessibleRestaurants"
    );

    if (String(sourceVendor?.createdByAdmin || "") === String(req.user.id)) {
      return true;
    }

    if (
      sourceVendor?.connectedAdmins?.some((adminId) => String(adminId) === String(req.user.id))
    ) {
      return true;
    }

    const adminRestaurantIds = await getAdminRestaurantIds(req.user.id);
    return getVendorRestaurantIds(sourceVendor).some((id) => adminRestaurantIds.includes(id));
  }

  return false;
};

export const getVendorProducts = async (req, res) => {
  try {
    const vendorId = req.params.id;
    if (!toObjectId(vendorId)) {
      return res.status(400).json({ success: false, message: "Invalid vendor id" });
    }

    const allowed = await canViewVendorProducts(req, vendorId);
    if (!allowed) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const query = { vendor: vendorId };
    if (req.user.role !== "vendor") {
      query.isActive = true;
    }

    if (req.user.role !== "vendor") {
      query.isForSale = true;
    }

    const products = await VendorProduct.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      products: products.map((product) => buildProductResponse(product, req.user.role)),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};

export const getExploreGlobalVendorProducts = async (req, res) => {
  try {
    const vendorId = req.params.id;
    if (!toObjectId(vendorId)) {
      return res.status(400).json({ success: false, message: "Invalid vendor id" });
    }

    const vendor = await Vendor.findById(vendorId).select("vendorType isActive");
    if (!vendor || vendor.vendorType !== "global" || vendor.isActive === false) {
      return res.status(404).json({ success: false, message: "Global vendor not found" });
    }

    const products = await VendorProduct.find({
      vendor: vendorId,
      isActive: true,
      isForSale: true,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      products: products.map((product) => buildProductResponse(product, "admin")),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};

export const createVendorProduct = async (req, res) => {
  try {
    const vendorId = req.params.id;

    if (req.user.role !== "vendor" || String(req.user.id) !== String(vendorId)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const name = String(req.body.name || "").trim();
    const price = Number(req.body.price ?? 0);
    const buyingPrice = Number(req.body.buyingPrice ?? req.body.price ?? 0);
    const stock = Number(req.body.stock ?? 0);
    const lowStockThreshold = Number(req.body.lowStockThreshold ?? 10);
    const orderUnitsPerStockUnit = Number(req.body.orderUnitsPerStockUnit ?? 1);
    const orderPackQuantity = Number(req.body.orderPackQuantity ?? 1);
    const requestedUnit = String(req.body.unit || "").trim();
    const stockUnit = String(req.body.stockUnit || requestedUnit).trim();
    const unit = requestedUnit || stockUnit;
    const isForSale = req.body.isForSale === true;
    const isListedInMyProducts = req.body.isListedInMyProducts === true;
    const imageDataUrl = String(req.body.imageDataUrl || "").trim();

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Product name is required",
      });
    }

    if (Number.isNaN(stock) || stock < 0) {
      return res.status(400).json({ success: false, message: "Stock must be 0 or more" });
    }

    if (Number.isNaN(lowStockThreshold) || lowStockThreshold < 0) {
      return res.status(400).json({
        success: false,
        message: "Low stock value must be 0 or more",
      });
    }

    if (Number.isNaN(buyingPrice) || buyingPrice < 0) {
      return res.status(400).json({
        success: false,
        message: "Buying price must be 0 or more",
      });
    }

    if (!stockUnit) {
      return res.status(400).json({
        success: false,
        message: "Inventory unit is required",
      });
    }

    if (!unit) {
      return res.status(400).json({
        success: false,
        message: "Order unit is required",
      });
    }

    if (Number.isNaN(orderUnitsPerStockUnit) || orderUnitsPerStockUnit <= 0) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid conversion between inventory unit and order unit",
      });
    }

    if (Number.isNaN(orderPackQuantity) || orderPackQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid selling pack quantity",
      });
    }

    if (Number.isNaN(price) || price < 0) {
      return res.status(400).json({
        success: false,
        message: "Selling price must be 0 or more",
      });
    }

    const uploadedImage = imageDataUrl
      ? await uploadProductImage({ imageDataUrl, vendorId })
      : null;

    const product = await VendorProduct.create({
      vendor: vendorId,
      name,
      description: String(req.body.description || "").trim(),
      price,
      buyingPrice,
      unit,
      stockUnit,
      orderUnitsPerStockUnit,
      orderPackQuantity,
      category: String(req.body.category || "").trim(),
      imageUrl: uploadedImage?.imageUrl || "",
      imagePublicId: uploadedImage?.imagePublicId || "",
      stock,
      lowStockThreshold,
      isForSale,
      isListedInMyProducts,
    });

    res.status(201).json({
      success: true,
      message: "Product added successfully",
      product: buildProductResponse(product, "vendor"),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};

export const updateVendorProduct = async (req, res) => {
  try {
    const vendorId = req.params.id;
    const productId = toObjectId(req.params.productId);

    if (req.user.role !== "vendor" || String(req.user.id) !== String(vendorId)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (!productId) {
      return res.status(400).json({ success: false, message: "Invalid product id" });
    }

    const product = await VendorProduct.findOne({
      _id: productId,
      vendor: vendorId,
    }).select("+imagePublicId");

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const allowedFields = [
      "name",
      "description",
      "price",
      "buyingPrice",
      "unit",
      "stockUnit",
      "orderUnitsPerStockUnit",
      "orderPackQuantity",
      "category",
      "stock",
      "lowStockThreshold",
      "isActive",
      "isForSale",
      "isListedInMyProducts",
    ];
    const imageDataUrl = String(req.body.imageDataUrl || "").trim();
    const removeImage = req.body.removeImage === true;

    const stockChangeMode = String(req.body.stockChangeMode || "").trim().toLowerCase();
    const isAddStockMode = stockChangeMode === "add";
    const originalStock = normalizePositiveNumber(product.stock);
    const originalBuyingPrice = normalizePositiveNumber(product.buyingPrice);

    if (isAddStockMode) {
      const addedStockQuantity = Number(
        req.body.addedStockQuantity ?? normalizePositiveNumber(req.body.stock) - originalStock
      );
      const addedStockBuyingPrice = Number(req.body.addedStockBuyingPrice ?? req.body.buyingPrice);

      if (Number.isNaN(addedStockQuantity) || addedStockQuantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Added stock quantity must be greater than 0",
        });
      }

      if (Number.isNaN(addedStockBuyingPrice) || addedStockBuyingPrice < 0) {
        return res.status(400).json({
          success: false,
          message: "Added stock buying price must be 0 or more",
        });
      }

      product.stock = Number((originalStock + addedStockQuantity).toFixed(6));
      product.buyingPrice = getWeightedAverageBuyingPrice({
        currentStock: originalStock,
        currentBuyingPrice: originalBuyingPrice,
        addedQuantity: addedStockQuantity,
        addedBuyingPrice: addedStockBuyingPrice,
      });
    }

    for (const field of allowedFields) {
      if (req.body[field] === undefined) continue;

      if (isAddStockMode && (field === "stock" || field === "buyingPrice")) {
        continue;
      }

      if (
        field === "price" ||
        field === "buyingPrice" ||
        field === "stock" ||
        field === "lowStockThreshold" ||
        field === "orderUnitsPerStockUnit" ||
        field === "orderPackQuantity"
      ) {
        const numericValue = Number(req.body[field]);
        const minValue =
          field === "orderUnitsPerStockUnit" || field === "orderPackQuantity" ? 0 : -1;
        if (Number.isNaN(numericValue) || numericValue <= minValue) {
          return res.status(400).json({
            success: false,
            message:
              field === "price"
                ? "Selling price must be 0 or more"
                : field === "buyingPrice"
                  ? "Buying price must be 0 or more"
                : field === "stock"
                  ? "Stock must be 0 or more"
                : field === "lowStockThreshold"
                  ? "Low stock value must be 0 or more"
                  : field === "orderPackQuantity"
                    ? "Selling pack quantity must be greater than 0"
                  : "Conversion must be greater than 0",
          });
        }
        product[field] = numericValue;
      } else if (field === "isActive") {
        product.isActive = Boolean(req.body.isActive);
      } else if (field === "isForSale") {
        product.isForSale = Boolean(req.body.isForSale);
      } else if (field === "isListedInMyProducts") {
        product.isListedInMyProducts = Boolean(req.body.isListedInMyProducts);
      } else if (field === "name") {
        product.name = String(req.body.name || "").trim();
      } else {
        product[field] = String(req.body[field] || "").trim();
      }
    }

    if (removeImage) {
      await removeProductImage(product.imagePublicId);
      product.imageUrl = "";
      product.imagePublicId = "";
    }

    if (imageDataUrl) {
      const uploadedImage = await uploadProductImage({ imageDataUrl, vendorId });
      await removeProductImage(product.imagePublicId);
      product.imageUrl = uploadedImage.imageUrl;
      product.imagePublicId = uploadedImage.imagePublicId;
    }

    if (product.isForSale) {
      product.isListedInMyProducts = true;
    }

    if (!product.name) {
      return res.status(400).json({ success: false, message: "Product name is required" });
    }

    if (!String(product.unit || "").trim()) {
      return res.status(400).json({ success: false, message: "Order unit is required" });
    }

    if (!String(product.stockUnit || "").trim()) {
      product.stockUnit = String(product.unit || "").trim();
    }

    if (!String(product.unit || "").trim()) {
      product.unit = String(product.stockUnit || "").trim();
    }

    await product.save();

    res.json({
      success: true,
      message: "Product updated successfully",
      product: buildProductResponse(product, "vendor"),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};

export const deleteVendorProduct = async (req, res) => {
  try {
    const vendorId = req.params.id;
    const productId = toObjectId(req.params.productId);

    if (req.user.role !== "vendor" || String(req.user.id) !== String(vendorId)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (!productId) {
      return res.status(400).json({ success: false, message: "Invalid product id" });
    }

    const product = await VendorProduct.findOneAndDelete({
      _id: productId,
      vendor: vendorId,
    }).select("+imagePublicId");

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    await removeProductImage(product.imagePublicId);

    res.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  getVendorProducts,
  getExploreGlobalVendorProducts,
  createVendorProduct,
  updateVendorProduct,
  deleteVendorProduct,
};
