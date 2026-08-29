import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import NotificationBell, { NotificationItem } from "@/app/components/NotificationBell";

const mockNotifications: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Milestone Approved",
    message: "Milestone #2 was approved by client.",
    timestamp: "10m ago",
    read: false,
    type: "success",
  },
  {
    id: "notif-2",
    title: "Payment Received",
    message: "250 XLM released.",
    timestamp: "1h ago",
    read: true,
    type: "info",
  },
];

describe("NotificationBell Component", () => {
  it("renders bell button with zero unread state by default", () => {
    render(<NotificationBell unreadCount={0} />);
    const bell = screen.getByTestId("notification-bell");
    expect(bell).toBeInTheDocument();
    expect(bell).toHaveAttribute("data-status", "read");
    expect(screen.queryByTestId("notification-badge")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Notifications" })).toBeInTheDocument();
  });

  it("renders unread count badge when unreadCount > 0", () => {
    render(<NotificationBell unreadCount={5} />);
    const bell = screen.getByTestId("notification-bell");
    expect(bell).toHaveAttribute("data-status", "unread");

    const badge = screen.getByTestId("notification-badge");
    expect(badge).toHaveTextContent("5");
    expect(
      screen.getByRole("button", { name: "Notifications (5 unread)" })
    ).toBeInTheDocument();
  });

  it("displays 99+ for unread counts over 99", () => {
    render(<NotificationBell unreadCount={150} />);
    const badge = screen.getByTestId("notification-badge");
    expect(badge).toHaveTextContent("99+");
  });

  it("toggles dropdown open and closed when bell is clicked (uncontrolled)", () => {
    render(<NotificationBell unreadCount={2} notifications={mockNotifications} />);
    const bell = screen.getByTestId("notification-bell");

    expect(screen.queryByTestId("notification-dropdown")).not.toBeInTheDocument();

    fireEvent.click(bell);
    expect(screen.getByTestId("notification-dropdown")).toBeInTheDocument();
    expect(screen.getByText("Milestone Approved")).toBeInTheDocument();

    fireEvent.click(bell);
    expect(screen.queryByTestId("notification-dropdown")).not.toBeInTheDocument();
  });

  it("respects controlled isOpen prop", () => {
    render(
      <NotificationBell
        isOpen={true}
        unreadCount={2}
        notifications={mockNotifications}
      />
    );
    expect(screen.getByTestId("notification-dropdown")).toBeInTheDocument();
  });

  it("renders loading state inside dropdown when isLoading is true", () => {
    render(<NotificationBell isOpen={true} isLoading={true} />);
    expect(screen.getByTestId("notification-loading")).toBeInTheDocument();
    expect(screen.getByText("Loading notifications…")).toBeInTheDocument();
  });

  it("renders error alert inside dropdown when error prop is provided", () => {
    render(
      <NotificationBell
        isOpen={true}
        error="Network error fetching notifications"
      />
    );
    expect(screen.getByTestId("notification-error")).toBeInTheDocument();
    expect(
      screen.getByText("Network error fetching notifications")
    ).toBeInTheDocument();
  });

  it("renders empty state inside dropdown when notifications list is empty", () => {
    render(<NotificationBell isOpen={true} notifications={[]} />);
    expect(screen.getByTestId("notification-empty")).toBeInTheDocument();
    expect(screen.getByText("No notifications yet")).toBeInTheDocument();
  });

  it("calls onMarkAllAsRead when 'Mark all as read' is clicked", () => {
    const onMarkAllAsRead = vi.fn();
    render(
      <NotificationBell
        isOpen={true}
        unreadCount={2}
        notifications={mockNotifications}
        onMarkAllAsRead={onMarkAllAsRead}
      />
    );

    const markBtn = screen.getByRole("button", { name: "Mark all as read" });
    fireEvent.click(markBtn);
    expect(onMarkAllAsRead).toHaveBeenCalledTimes(1);
  });

  it("calls onNotificationClick when a notification item is clicked", () => {
    const onNotificationClick = vi.fn();
    render(
      <NotificationBell
        isOpen={true}
        notifications={mockNotifications}
        onNotificationClick={onNotificationClick}
      />
    );

    const item = screen.getByTestId("notification-item-notif-1");
    fireEvent.click(item);
    expect(onNotificationClick).toHaveBeenCalledWith(mockNotifications[0]);
  });

  it("calls onClearAll when 'Clear all' button is clicked", () => {
    const onClearAll = vi.fn();
    render(
      <NotificationBell
        isOpen={true}
        notifications={mockNotifications}
        onClearAll={onClearAll}
      />
    );

    const clearBtn = screen.getByRole("button", { name: "Clear all" });
    fireEvent.click(clearBtn);
    expect(onClearAll).toHaveBeenCalledTimes(1);
  });

  it("does not toggle dropdown when disabled is true", () => {
    const onBellClick = vi.fn();
    render(<NotificationBell disabled={true} onBellClick={onBellClick} />);

    const bell = screen.getByTestId("notification-bell");
    expect(bell).toBeDisabled();
    expect(bell).toHaveAttribute("data-status", "disabled");

    fireEvent.click(bell);
    expect(onBellClick).not.toHaveBeenCalled();
    expect(screen.queryByTestId("notification-dropdown")).not.toBeInTheDocument();
  });

  it("sets correct aria attributes for accessibility", () => {
    render(<NotificationBell unreadCount={3} isOpen={true} />);
    const bell = screen.getByTestId("notification-bell");

    expect(bell).toHaveAttribute("aria-expanded", "true");
    expect(bell).toHaveAttribute("aria-haspopup", "true");
    expect(bell).toHaveAttribute("aria-label", "Notifications (3 unread)");
  });
});
