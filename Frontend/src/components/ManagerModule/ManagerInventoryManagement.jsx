import AdminInventory from "../AdminModule/AdminInventory";

const getAssignedRestaurant = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
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
  } catch {
    return {
      restaurantId: "",
      restaurantName: "Assigned Restaurant",
    };
  }
};

export default function ManagerInventoryManagement() {
  const { restaurantId, restaurantName } = getAssignedRestaurant();

  return (
    <AdminInventory
      fixedRestaurantId={restaurantId}
      fixedRestaurantName={restaurantName}
    />
  );
}
