import { getUser } from "../../services/auth.service";
import AdminInventory from "../AdminModule/AdminInventory";

const getAssignedRestaurant = () => {
  const user = getUser() || {};
  const restaurant =
    typeof user?.restaurant === "object"
      ? user.restaurant
      : {
          _id: user?.restaurant || "",
          name: user?.restaurantName || "Assigned Restaurant",
        };

  return {
    restaurantId: restaurant?._id || "",
    restaurantName: restaurant?.name || "Assigned Restaurant",
  };
};

export default function InventoryManagerManagement() {
  const { restaurantId, restaurantName } = getAssignedRestaurant();

  return (
    <AdminInventory
      fixedRestaurantId={restaurantId}
      fixedRestaurantName={restaurantName}
    />
  );
}
