import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';

export interface ServiceItem {
  id: number;
  name: string;
  image: string;
  price: string;
  rating: number;
  reviews: number;
  type: string;
}

const FALLBACK_TOUR = 'https://images.unsplash.com/photo-1770753896796-353db8c7de17?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800';
const FALLBACK_HOTEL = 'https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800';

export function useHome() {
  const [tours, setTours] = useState<ServiceItem[]>([]);
  const [hotels, setHotels] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const resp = await fetch('/api/user/services');
        if (!resp.ok) throw new Error('API error');
        const data: any[] = await resp.json();

        const toServiceItem = (s: any, fallback: string): ServiceItem => ({
          id: s.id,
          name: s.name,
          image: s.imageUrl && s.imageUrl !== 'https://via.placeholder.com/200' ? s.imageUrl : fallback,
          price: Number(s.price).toLocaleString('vi-VN'),
          rating: 4.7 + Math.random() * 0.3,
          reviews: Math.floor(Math.random() * 150) + 50,
          type: s.type,
        });

        setTours(data.filter((s: any) => s.type === 'TOUR').slice(0, 10).map((s: any) => toServiceItem(s, FALLBACK_TOUR)));
        setHotels(data.filter((s: any) => s.type === 'HOTEL').slice(0, 10).map((s: any) => toServiceItem(s, FALLBACK_HOTEL)));
      } catch {
        // Keep empty arrays — sections simply won't render
      } finally {
        setIsLoading(false);
      }
    };
    fetchServices();
  }, []);

  const handleServiceClick = (id: number) => {
    // Điều hướng sang Marketplace và truyền ID để tự động mở chi tiết
    navigate(`/user/marketplace?id=${id}`);
  };

  return {
    tours,
    hotels,
    isLoading,
    handleServiceClick,
    navigate
  };
}
