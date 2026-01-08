import { useState, useEffect, useCallback } from "react";
import { CheckCircle, TrendingUp, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

// Simulated data for social proof
const simulatedNames = [
  "Andreia", "Carlos", "Juliana", "Rafael", "Mariana", "Lucas", "Fernanda", 
  "Bruno", "Patricia", "Ricardo", "Amanda", "Felipe", "Camila", "Gustavo",
  "Beatriz", "Thiago", "Larissa", "Diego", "Vanessa", "Eduardo"
];

const simulatedBrands = [
  "Bella Fit", "Nova Prime", "Doce Encanto", "TechMais", "Arte Viva",
  "Sabor Brasil", "Luz Digital", "Moda Única", "Café Premium", "Studio Pro",
  "Green Life", "Smart Home", "Beleza Natural", "Fast Delivery", "Urban Style",
  "Gourmet Express", "Fit & Health", "Digital Agency", "Pet Love", "Clean House"
];

interface Notification {
  id: number;
  message: string;
  icon: "check" | "shield" | "trending";
}

const SocialProofNotification = () => {
  const { t } = useLanguage();
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [lastNameIndex, setLastNameIndex] = useState(-1);
  const [notificationCount, setNotificationCount] = useState(0);

  const getRandomIndex = useCallback((array: any[], excludeIndex: number) => {
    let index;
    do {
      index = Math.floor(Math.random() * array.length);
    } while (index === excludeIndex && array.length > 1);
    return index;
  }, []);

  const generateNotification = useCallback((): Notification => {
    const statsNotifications = [
      { message: t("social.stat1"), icon: "trending" as const },
      { message: t("social.stat2"), icon: "check" as const },
      { message: t("social.stat3"), icon: "trending" as const },
    ];

    const actionTemplates = [
      { template: `{name} ${t("social.registered")} {brand}`, icon: "check" as const },
      { template: `{name} ${t("social.consulted")} {brand}`, icon: "check" as const },
      { template: `{name} ${t("social.secured")} {brand}`, icon: "shield" as const },
      { template: `{name} ${t("social.started")} {brand}`, icon: "trending" as const },
      { template: `{name} ${t("social.protected")}`, icon: "shield" as const },
    ];

    // Every 5th notification, show a stats notification
    if (notificationCount > 0 && notificationCount % 5 === 0) {
      const stat = statsNotifications[Math.floor(Math.random() * statsNotifications.length)];
      return {
        id: Date.now(),
        message: stat.message,
        icon: stat.icon,
      };
    }

    // Generate action notification
    const nameIndex = getRandomIndex(simulatedNames, lastNameIndex);
    setLastNameIndex(nameIndex);
    
    const name = simulatedNames[nameIndex];
    const brand = simulatedBrands[Math.floor(Math.random() * simulatedBrands.length)];
    const action = actionTemplates[Math.floor(Math.random() * actionTemplates.length)];
    
    const message = action.template
      .replace("{name}", name)
      .replace("{brand}", brand);

    return {
      id: Date.now(),
      message,
      icon: action.icon,
    };
  }, [getRandomIndex, lastNameIndex, notificationCount, t]);

  useEffect(() => {
    // Initial delay of 1 second before first notification
    const initialTimeout = setTimeout(() => {
      showNotification();
    }, 1000);

    return () => clearTimeout(initialTimeout);
  }, []);

  const showNotification = useCallback(() => {
    const newNotification = generateNotification();
    setNotification(newNotification);
    setIsVisible(true);
    setNotificationCount(prev => prev + 1);

    // Hide after 3 seconds
    setTimeout(() => {
      setIsVisible(false);
      
      // Show next notification after 2 seconds gap
      setTimeout(() => {
        showNotification();
      }, 2000);
    }, 3000);
  }, [generateNotification]);

  const IconComponent = notification?.icon === "shield" 
    ? Shield 
    : notification?.icon === "trending" 
      ? TrendingUp 
      : CheckCircle;

  if (!notification) return null;

  return (
    <div
      className={cn(
        "fixed z-40 transition-all duration-500 ease-out",
        "top-20 md:top-24 left-4 md:left-6",
        "max-w-[calc(100vw-2rem)] md:max-w-sm",
        isVisible 
          ? "opacity-100 translate-x-0 translate-y-0" 
          : "opacity-0 -translate-x-4 -translate-y-2 pointer-events-none"
      )}
    >
      <div className="glass-card p-3 md:p-4 flex items-start gap-3 border-l-4 border-l-primary shadow-lg">
        <div className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <IconComponent className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs md:text-sm font-medium text-foreground leading-snug">
            {notification.message}
          </p>
          <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
            {t("social.now")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SocialProofNotification;
