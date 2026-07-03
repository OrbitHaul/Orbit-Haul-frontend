import {
  Bell, Settings, UserCircle, Check,
  Truck, FileText, AlertTriangle, Server, Receipt, DollarSign, Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import SearchInput from "../../components/ui/SearchInput";

type NotificationFilterType = "all" | "shipments" | "settlements" | "system";
type NotificationIconType = "shipment" | "contract" | "alert" | "system" | "invoice" | "payment";

interface Notification {
  id: string;
  type: Exclude<NotificationFilterType, "all">;
  icon: NotificationIconType;
  title: string;
  badge?: string;
  badgeColor?: string;
  description: string;
  timestamp: string;
  isRead: boolean;
}

const iconStyles: Record<NotificationIconType, string> = {
  shipment: "bg-[rgba(37,99,235,0.1)] text-[#3b82f6]",
  contract: "bg-[rgba(5,150,105,0.1)] text-[#10b981]",
  alert:    "bg-[rgba(220,38,38,0.1)] text-[#ef4444]",
  system:   "bg-[rgba(107,114,128,0.1)] text-[#9ca3af]",
  invoice:  "bg-[rgba(107,114,128,0.1)] text-[#9ca3af]",
  payment:  "bg-[rgba(74,222,128,0.1)] text-[#4ade80]",
};

const ITEMS_PER_PAGE = 10;

const INITIAL_NOTIFICATIONS: Notification[] = [
  // 6 unread (shipments/settlements/system — show under TODAY when unread)
  { id: "n1",  type: "shipments",   icon: "shipment", title: "Shipment Arrived at Port",       badge: "NV-9920",  badgeColor: "#3b82f6", description: "Your shipment NV-9920 has arrived at the destination port and is awaiting customs clearance.", timestamp: "2 minutes ago", isRead: false },
  { id: "n2",  type: "shipments",   icon: "shipment", title: "New Shipment Registered",        badge: "NV-9921",  badgeColor: "#3b82f6", description: "A new shipment has been registered and is being prepared for dispatch.", timestamp: "15 minutes ago", isRead: false },
  { id: "n3",  type: "settlements", icon: "contract", title: "Smart Contract Executed",        badge: "SC-4401",  badgeColor: "#10b981", description: "Smart contract SC-4401 has been executed and funds have been released to the carrier.", timestamp: "1 hour ago", isRead: false },
  { id: "n4",  type: "settlements", icon: "payment",  title: "Payment Initiated",              badge: "PMT-882",  badgeColor: "#4ade80", description: "A payment of $12,400 has been initiated for shipment SHP-449.", timestamp: "2 hours ago", isRead: false },
  { id: "n5",  type: "system",      icon: "alert",    title: "Security Alert",                 description: "Unusual login activity detected on your account. Please verify your recent sessions.", timestamp: "3 hours ago", isRead: false },
  { id: "n6",  type: "system",      icon: "system",   title: "System Maintenance Scheduled",   description: "Scheduled maintenance is planned for Sunday 2 AM UTC. Expect brief downtime.", timestamp: "4 hours ago", isRead: false },
  // 10 read (show under EARLIER)
  { id: "n7",  type: "shipments",   icon: "shipment", title: "Customs Clearance Completed",   badge: "NV-9900",  badgeColor: "#3b82f6", description: "Customs clearance for shipment NV-9900 has been successfully completed.", timestamp: "Yesterday", isRead: true },
  { id: "n8",  type: "shipments",   icon: "shipment", title: "Shipment In Transit",            badge: "NV-9895",  badgeColor: "#3b82f6", description: "Your shipment NV-9895 is currently in transit and on schedule.", timestamp: "Yesterday", isRead: true },
  { id: "n9",  type: "settlements", icon: "contract", title: "Escrow Funds Released",          badge: "SC-4390",  badgeColor: "#10b981", description: "Escrowed funds for contract SC-4390 have been released upon delivery confirmation.", timestamp: "2 days ago", isRead: true },
  { id: "n10", type: "system",      icon: "system",   title: "Account Settings Updated",       description: "Your account notification preferences have been updated successfully.", timestamp: "2 days ago", isRead: true },
  { id: "n11", type: "shipments",   icon: "shipment", title: "Delivery Confirmed",             badge: "NV-9871",  badgeColor: "#3b82f6", description: "Delivery for shipment NV-9871 has been confirmed by the recipient.", timestamp: "3 days ago", isRead: true },
  // --- PAGE 2 STARTS HERE (items 11–16) ---
  { id: "n12", type: "shipments",   icon: "alert",    title: "Delivery Delayed",               badge: "NV-9860",  badgeColor: "#ef4444", description: "Shipment NV-9860 has been delayed due to adverse weather conditions. New ETA: +2 days.", timestamp: "4 days ago", isRead: true },
  { id: "n13", type: "settlements", icon: "invoice",  title: "Invoice Generated",              badge: "INV-2210", badgeColor: "#9ca3af", description: "Invoice INV-2210 has been generated for completed shipment SHP-312.", timestamp: "4 days ago", isRead: true },
  { id: "n14", type: "shipments",   icon: "shipment", title: "Shipment Picked Up",             badge: "NV-9851",  badgeColor: "#3b82f6", description: "Shipment NV-9851 has been picked up by the carrier.", timestamp: "5 days ago", isRead: true },
  { id: "n15", type: "system",      icon: "system",   title: "New Feature Available",          description: "Real-time shipment tracking is now available on all active shipments.", timestamp: "6 days ago", isRead: true },
  { id: "n16", type: "settlements", icon: "payment",  title: "Dispute Resolved",               badge: "DIS-105",  badgeColor: "#4ade80", description: "Dispute DIS-105 has been resolved in your favour. Funds will be transferred within 2 business days.", timestamp: "1 week ago", isRead: true },
];

function getIconComponent(icon: NotificationIconType) {
  const size = 20;
  switch (icon) {
    case "shipment": return <Truck size={size} />;
    case "contract": return <FileText size={size} />;
    case "alert":    return <AlertTriangle size={size} />;
    case "system":   return <Server size={size} />;
    case "invoice":  return <Receipt size={size} />;
    case "payment":  return <DollarSign size={size} />;
    default:         return <Bell size={size} />;
  }
}

const NotificationsPage = () => {
  const [activeFilter, setActiveFilter] = useState<NotificationFilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter & search
  const filteredNotifications = useMemo(() => {
    let result = notifications;
    if (activeFilter !== "all") {
      result = result.filter((n) => n.type === activeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          (n.badge && n.badge.toLowerCase().includes(q)) ||
          n.description.toLowerCase().includes(q),
      );
    }
    return result;
  }, [notifications, activeFilter, searchQuery]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredNotifications.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedNotifications = filteredNotifications.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );

  const unreadNotifications = pagedNotifications.filter((n) => !n.isRead);
  const readNotifications = pagedNotifications.filter((n) => n.isRead);

  // Filter counts (from all notifications, ignoring search & pagination)
  const filterCounts = useMemo(() => ({
    all:         notifications.length,
    shipments:   notifications.filter((n) => n.type === "shipments").length,
    settlements: notifications.filter((n) => n.type === "settlements").length,
    system:      notifications.filter((n) => n.type === "system").length,
  }), [notifications]);

  const currentUnreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleFilterChange = (filter: NotificationFilterType) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    setCurrentPage(1);
  };

  const filters: { key: NotificationFilterType; label: string }[] = [
    { key: "all",         label: "All" },
    { key: "shipments",   label: "Shipments" },
    { key: "settlements", label: "Settlements" },
    { key: "system",      label: "System" },
  ];

  const NotificationCard = ({ notification }: { notification: Notification }) => (
    <div
      className={`border rounded-xl p-5 flex gap-4 transition-all cursor-pointer ${
        notification.isRead
          ? "bg-[#1a1f28] border-[#374151]"
          : "bg-[#1f2937] border-[#374151] hover:bg-[#283039] hover:border-[#4b5563]"
      }`}
    >
      <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 relative ${iconStyles[notification.icon]}`}>
        {getIconComponent(notification.icon)}
        {!notification.isRead && <div className="absolute top-1 right-1 w-2 h-2 bg-[#3b82f6] rounded-full" />}
      </div>

      <div className="flex-1 flex flex-col gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`text-base font-semibold ${notification.isRead ? "text-[#6b7280] font-medium" : "text-white font-bold"}`}>
            {notification.title}
          </span>
          {notification.badge && (
            <span
              className="px-2.5 py-1 rounded text-[11px] font-semibold tracking-[0.5px] text-white inline-flex items-center whitespace-nowrap leading-none"
              style={
                notification.isRead
                  ? { backgroundColor: "transparent", border: `1px solid ${notification.badgeColor}`, color: notification.badgeColor }
                  : { backgroundColor: notification.badgeColor, borderColor: notification.badgeColor }
              }
            >
              {notification.badge}
            </span>
          )}
        </div>
        <p className={`text-sm leading-[1.5] m-0 ${notification.isRead ? "text-[#6b7280]" : "text-[#9ca3af]"}`}>
          {notification.description}
        </p>
        <span className="text-xs text-[#6b7280]">{notification.timestamp}</span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {!notification.isRead && (
          <button
            className="w-9 h-9 rounded-md bg-transparent border border-[#374151] flex items-center justify-center cursor-pointer transition-all text-[#6b7280] hover:bg-[#374151] hover:border-[#4b5563] hover:text-white"
            aria-label="Mark as read"
            onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notification.id); }}
          >
            <Check size={16} />
          </button>
        )}
        <button
          className="w-9 h-9 rounded-md bg-transparent border border-[#374151] flex items-center justify-center cursor-pointer transition-all text-[#6b7280] hover:bg-[#374151] hover:border-[#4b5563] hover:text-white"
          aria-label="Delete notification"
          onClick={(e) => { e.stopPropagation(); handleDeleteNotification(notification.id); }}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-[#101922] min-h-screen text-white">
      <div className="bg-[#111418] w-full border-b border-[#283039] px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/plan.svg" alt="Plan Icon" className="w-8 h-8" />
          <p className="text-lg font-semibold m-0 tracking-[0.5px]">ORBITHAUL</p>
        </div>
        <div className="flex items-center gap-8">
          <nav className="flex gap-8">
            {["Dashboard", "Shipments", "Settlements", "Contracts", "Network"].map((item) => (
              <span key={item} className="cursor-pointer text-sm text-[#9ca3af] hover:text-white transition-colors">{item}</span>
            ))}
          </nav>
          <div className="flex gap-3">
            {[
              { icon: <Bell size={20} />, active: true, label: "Notifications" },
              { icon: <Settings size={20} />, label: "Settings" },
              { icon: <UserCircle size={20} />, label: "Profile" },
            ].map(({ icon, active, label }, i) => (
              <button key={i} aria-label={label} className={`w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer transition-colors border-none ${active ? "bg-[#2563eb] text-white" : "bg-[#1f2937] text-[#9ca3af] hover:bg-[#374151]"}`}>
                {icon}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-8 py-12">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-[32px] font-semibold m-0 mb-2">Notifications</h1>
            <p className="text-[#9ca3af] text-sm m-0">Stay updated with your supply chain events and settlements.</p>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2.5 bg-[#283039] border border-[#374151] rounded-lg text-white text-sm cursor-pointer transition-all hover:bg-[#1f2937] hover:border-[#4b5563] disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleMarkAllAsRead}
            disabled={currentUnreadCount === 0}
          >
            <Check size={16} /> Mark all as read
          </button>
        </div>

        <div className="flex justify-between items-center mb-8 gap-6 border-b border-[#283039] pb-5 flex-wrap">
          <div className="flex gap-2 flex-wrap items-center">
            {filters.map(({ key, label }) => (
              <button
                key={key}
                className={`px-4 py-2.5 border-none rounded-[20px] text-sm cursor-pointer transition-all flex items-center gap-2 ${
                  activeFilter === key ? "bg-[#2563eb] text-white" : "bg-transparent text-[#9ca3af] hover:bg-[#1f2937] hover:text-white"
                }`}
                onClick={() => handleFilterChange(key)}
              >
                {label}
                <span className="bg-[rgba(255,255,255,0.2)] px-2 py-0.5 rounded-xl text-xs font-semibold">
                  {filterCounts[key]}
                </span>
              </button>
            ))}
          </div>
          <SearchInput
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search by ID, contract, or keyword..."
            isLoading={false}
          />
        </div>

        <div className="flex flex-col gap-4">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center text-[#6b7280]">
              <Bell size={48} className="mb-6 opacity-50" />
              <h3 className="text-xl font-semibold text-[#9ca3af] m-0 mb-2">No notifications found</h3>
              <p className="text-sm m-0">
                {searchQuery ? "Try adjusting your search terms" : "You're all caught up! No notifications in this category."}
              </p>
            </div>
          ) : (
            <>
              {unreadNotifications.length > 0 && (
                <>
                  <div className="text-xs font-semibold text-[#6b7280] tracking-[0.5px] mt-4 mb-2">TODAY</div>
                  {unreadNotifications.map((notification) => (
                    <NotificationCard key={notification.id} notification={notification} />
                  ))}
                </>
              )}
              {readNotifications.length > 0 && (
                <>
                  <div className="text-xs font-semibold text-[#6b7280] tracking-[0.5px] mt-4 mb-2">EARLIER</div>
                  {readNotifications.map((notification) => (
                    <NotificationCard key={notification.id} notification={notification} />
                  ))}
                </>
              )}
            </>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              className="px-4 py-2 rounded-lg bg-[#283039] border border-[#374151] text-white text-sm cursor-pointer transition-all hover:bg-[#374151] disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
            >
              Previous
            </button>
            <span className="text-sm text-[#9ca3af]">Page {safePage} of {totalPages}</span>
            <button
              className="px-4 py-2 rounded-lg bg-[#283039] border border-[#374151] text-white text-sm cursor-pointer transition-all hover:bg-[#374151] disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
