import { useState, useEffect, createElement } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../../../../contexts/AuthContext';
import { toast } from 'sonner';
import { Check } from 'lucide-react';

export function useMarketplace() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [filterType, setFilterType] = useState<'ALL' | 'TOUR' | 'HOTEL' | 'RESTAURANT' | 'CAFE' | 'KHAC'>((searchParams.get('type') as any) || 'ALL');
  const [showOpenNow, setShowOpenNow] = useState(false);
  const [showNearMe, setShowNearMe] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Booking states
  const [bookingDate, setBookingDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() + 1); // Default to tomorrow
    return today.toISOString().split('T')[0];
  });
  const [bookingQuantity, setBookingQuantity] = useState(1);
  const [bookingNights, setBookingNights] = useState(1);
  const [bookingTime, setBookingTime] = useState('08:00');
  const [bookingTransport, setBookingTransport] = useState('Xe máy');

  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewType, setReviewType] = useState<'REVIEW' | 'REPORT'>('REVIEW');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Distance Calculation
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const isServiceOpen = (s: any) => {
    if (!s.openingTime || !s.closingTime) return true;
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const [oH, oM] = s.openingTime.split(':').map(Number);
    const openMins = oH * 60 + (oM || 0);
    const [cH, cM] = s.closingTime.split(':').map(Number);
    let closeMins = cH * 60 + (cM || 0);
    if (closeMins > openMins) return currentMins >= openMins && currentMins <= closeMins;
    return currentMins >= openMins || currentMins <= closeMins;
  };

  const requestGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          toast.custom((t) => createElement('div', { 
              className: "flex items-center gap-2.5 bg-[#22c55e] text-white px-6 py-3.5 rounded-full shadow-2xl border border-transparent w-max animate-in slide-in-from-right-12 fade-in duration-500 ease-out" 
            }, 
            createElement('div', { className: "bg-white rounded-full flex items-center justify-center w-6 h-6 shrink-0 shadow-sm" },
              createElement(Check, { className: "w-4 h-4 text-[#22c55e]", strokeWidth: 4 })
            ),
            createElement('span', { className: "font-bold text-[16px] tracking-tight" }, "Đã cập nhật vị trí thẻ định vị!")
          ), { position: 'bottom-right', duration: 3500 });
        },
        () => toast.error("Bạn đã từ chối hoặc máy không hỗ trợ chia sẻ Định Vị.", { position: 'bottom-right' })
      );
    } else {
      toast.error("Trình duyệt không hỗ trợ định vị.");
    }
  };

  useEffect(() => {
    const q = searchParams.get('q');
    const type = searchParams.get('type');
    const id = searchParams.get('id');
    
    if (q !== null) setSearchTerm(q);
    if (type !== null) setFilterType(type as any);
    
    // Auto-select service if ID is in URL
    if (id && services.length > 0) {
      const service = services.find(s => s.id === parseInt(id));
      if (service) setSelectedService(service);
    }
  }, [searchParams, services]);

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (selectedService) {
      fetchServiceReviews(selectedService.id);
    }
  }, [selectedService]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/services');
      if (!response.ok) throw new Error('Không thể tải danh sách dịch vụ');
      const data = await response.json();
      setServices(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchServiceReviews = async (serviceId: number) => {
    try {
      setLoadingReviews(true);
      const response = await fetch(`/api/reviews/service/${serviceId}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
      }
    } catch (err) {
       console.error(err);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleBook = async (serviceId: number) => {
    if (!user) {
      // Smart redirect: Save current URL (with ID) to return to it after login
      const currentPath = window.location.pathname + window.location.search;
      navigate('/auth', { state: { from: currentPath } });
      return;
    }
    try {
      setBookingLoading(true);
      const params = new URLSearchParams();
      params.append('bookingDate', bookingDate);
      params.append('quantity', bookingQuantity.toString());
      if (selectedService?.serviceType === 'HOTEL') params.append('bookingDays', bookingNights.toString());
      if (selectedService?.serviceType === 'RESTAURANT') params.append('bookingTime', bookingTime);
      
      const response = await fetch(`/api/user/book/${serviceId}?${params.toString()}`, { method: 'POST' });
      if (!response.ok) throw new Error('Đặt dịch vụ thất bại');
      setBookingSuccess(true);
      toast.success('Đã gửi yêu cầu đặt dịch vụ thành công!');
      setTimeout(() => { setBookingSuccess(false); setSelectedService(null); }, 2000);
    } catch (err: any) {
       toast.error(err.message || 'Lỗi hệ thống');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!selectedService || !reviewContent.trim() || !user) return;
    try {
      setSubmittingReview(true);
      const params = new URLSearchParams();
      params.append('serviceId', selectedService.id.toString());
      params.append('type', reviewType);
      params.append('content', reviewContent);
      if (reviewType === 'REVIEW') params.append('rating', reviewRating.toString());
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      });
      if (response.ok) {
         toast.success("Đã gửi đánh giá thành công!");
         setReviewContent('');
      } else {
         toast.error("Có lỗi xảy ra khi gửi đánh giá.");
      }
    } catch (err) { console.error(err); }
    finally { setSubmittingReview(false); }
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = (service.serviceName || service.name || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || service.type === filterType || service.serviceType === filterType;
    if (showOpenNow && !isServiceOpen(service)) return false;
    if (showNearMe && userLocation && service.mapPoints) {
       const firstPoint = service.mapPoints.split('|').filter((x: string) => x)[0];
       if (firstPoint) {
           const coords = firstPoint.split(';')[0].split(',');
           const dist = getDistance(userLocation.lat, userLocation.lng, parseFloat(coords[0]), parseFloat(coords[1]));
           if (dist > 5) return false;
       }
    }
    return matchesSearch && matchesType;
  });

  return {
    searchTerm, setSearchTerm,
    filterType, setFilterType,
    showOpenNow, setShowOpenNow,
    showNearMe, setShowNearMe,
    userLocation,
    loading, error, services,
    filteredServices,
    selectedService, setSelectedService,
    bookingLoading, bookingSuccess,
    bookingDate, setBookingDate,
    bookingQuantity, setBookingQuantity,
    bookingNights, setBookingNights,
    bookingTime, setBookingTime,
    bookingTransport, setBookingTransport,
    reviews, loadingReviews,
    reviewType, setReviewType,
    reviewRating, setReviewRating,
    reviewContent, setReviewContent,
    submittingReview,
    handleBook, handleReviewSubmit,
    requestGPS, fetchServices, getDistance, isServiceOpen
  };
}
