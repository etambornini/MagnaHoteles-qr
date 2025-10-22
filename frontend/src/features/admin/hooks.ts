import { useAuth } from "@/features/auth/AuthProvider";

export const useAdminHotelContext = () => {
  const { token, user, isAdmin, activeHotel } = useAuth();
  const hotelIdentifier = isAdmin ? activeHotel?.slug ?? null : activeHotel?.slug ?? user?.hotel?.slug ?? null;

  return {
    token,
    user,
    isAdmin,
    activeHotel,
    hotelIdentifier,
  };
};
