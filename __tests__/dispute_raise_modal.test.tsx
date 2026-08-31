import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DisputeRaiseModal from "@/app/components/DisputeRaiseModal";

describe("DisputeRaiseModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    milestoneNumber: 1,
    isPending: false,
    errorMessage: null,
  };

  describe("Rendering", () => {
    it("renders when isOpen is true", () => {
      render(<DisputeRaiseModal {...defaultProps} />);
      expect(
        screen.getByRole("dialog", { name: "Raise Dispute" })
      ).toBeInTheDocument();
    });

    it("does not render when isOpen is false", () => {
      render(<DisputeRaiseModal {...defaultProps} isOpen={false} />);
      expect(
        screen.queryByRole("dialog", { name: "Raise Dispute" })
      ).not.toBeInTheDocument();
    });

    it("displays the correct milestone number in the title", () => {
      render(<DisputeRaiseModal {...defaultProps} milestoneNumber={3} />);
      expect(
        screen.getByText("Raise Dispute for Milestone 3")
      ).toBeInTheDocument();
    });

    it("renders the close button", () => {
      render(<DisputeRaiseModal {...defaultProps} />);
      expect(
        screen.getByRole("button", { name: "Close" })
      ).toBeInTheDocument();
    });

    it("renders the cancel button", () => {
      render(<DisputeRaiseModal {...defaultProps} />);
      expect(
        screen.getByRole("button", { name: "Cancel" })
      ).toBeInTheDocument();
    });

    it("renders the confirm button", () => {
      render(<DisputeRaiseModal {...defaultProps} />);
      expect(
        screen.getByRole("button", { name: "Raise Dispute" })
      ).toBeInTheDocument();
    });

    it("renders the reason textarea", () => {
      render(<DisputeRaiseModal {...defaultProps} />);
      expect(
        screen.getByLabelText("Reason for dispute (optional)")
      ).toBeInTheDocument();
    });

    it("displays error message when provided", () => {
      render(
        <DisputeRaiseModal
          {...defaultProps}
          errorMessage="Failed to raise dispute"
        />
      );
      expect(
        screen.getByText("Failed to raise dispute")
      ).toBeInTheDocument();
    });

    it("shows loading state when isPending is true", () => {
      render(<DisputeRaiseModal {...defaultProps} isPending={true} />);
      expect(
        screen.getByRole("button", { name: "Raising Dispute..." })
      ).toBeInTheDocument();
    });
  });

  describe("CSS Micro-animations", () => {
    it("applies fade-in animation to modal backdrop", () => {
      render(<DisputeRaiseModal {...defaultProps} />);
      const backdrop = screen.getByRole("dialog", { name: "Raise Dispute" });
      expect(backdrop).toHaveClass("animate-fade-in");
    });

    it("applies slide-in animation to modal content", () => {
      render(<DisputeRaiseModal {...defaultProps} />);
      const content = screen.getByTestId("dispute-raise-modal-content");
      expect(content).toHaveClass("animate-slide-in");
    });

    it("applies shake animation to error message", () => {
      render(
        <DisputeRaiseModal
          {...defaultProps}
          errorMessage="Error occurred"
        />
      );
      const error = screen.getByTestId("dispute-raise-modal-error");
      expect(error).toHaveClass("animate-shake");
    });

    it("applies transition-colors to close button", () => {
      render(<DisputeRaiseModal {...defaultProps} />);
      const closeButton = screen.getByRole("button", { name: "Close" });
      expect(closeButton).toHaveClass("transition-colors");
    });

    it("applies hover scale animation to close button", () => {
      render(<DisputeRaiseModal {...defaultProps} />);
      const closeButton = screen.getByRole("button", { name: "Close" });
      expect(closeButton).toHaveClass("hover:scale-110");
    });

    it("applies active scale animation to close button", () => {
      render(<DisputeRaiseModal {...defaultProps} />);
      const closeButton = screen.getByRole("button", { name: "Close" });
      expect(closeButton).toHaveClass("active:scale-95");
    });

    it("applies transition-all to cancel button", () => {
      render(<DisputeRaiseModal {...defaultProps} />);
      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      expect(cancelButton).toHaveClass("transition-all");
    });

    it("applies hover scale animation to cancel button", () => {
      render(<DisputeRaiseModal {...defaultProps} />);
      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      expect(cancelButton).toHaveClass("hover:scale-[1.02]");
    });

    it("applies active scale animation to cancel button", () => {
      render(<DisputeRaiseModal {...defaultProps} />);
      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      expect(cancelButton).toHaveClass("active:scale-[0.98]");
    });

    it("applies transition-all to confirm button", () => {
      render(<DisputeRaiseModal {...defaultProps} />);
      const confirmButton = screen.getByRole("button", { name: "Raise Dispute" });
      expect(confirmButton).toHaveClass("transition-all");
    });

    it("applies hover scale animation to confirm button", () => {
      render(<DisputeRaiseModal {...defaultProps} />);
      const confirmButton = screen.getByRole("button", { name: "Raise Dispute" });
      expect(confirmButton).toHaveClass("hover:scale-[1.02]");
    });

    it("applies active scale animation to confirm button", () => {
      render(<DisputeRaiseModal {...defaultProps} />);
      const confirmButton = screen.getByRole("button", { name: "Raise Dispute" });
      expect(confirmButton).toHaveClass("active:scale-[0.98]");
    });

    it("applies transition-all to textarea", () => {
      render(<DisputeRaiseModal {...defaultProps} />);
      const textarea = screen.getByLabelText("Reason for dispute (optional)");
      expect(textarea).toHaveClass("transition-all");
    });

    it("applies focus scale animation to textarea", () => {
      render(<DisputeRaiseModal {...defaultProps} />);
      const textarea = screen.getByLabelText("Reason for dispute (optional)");
      expect(textarea).toHaveClass("focus:scale-[1.01]");
    });

    it("applies hover border animation to textarea", () => {
      render(<DisputeRaiseModal {...defaultProps} />);
      const textarea = screen.getByLabelText("Reason for dispute (optional)");
      expect(textarea).toHaveClass("hover:border-border-strong");
    });

    it("disables hover scale animation on buttons when disabled", () => {
      render(<DisputeRaiseModal {...defaultProps} isPending={true} />);
      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      expect(cancelButton).toHaveClass("disabled:hover:scale-100");
    });

    it("disables active scale animation on buttons when disabled", () => {
      render(<DisputeRaiseModal {...defaultProps} isPending={true} />);
      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      expect(cancelButton).toHaveClass("disabled:hover:scale-100");
    });
  });

  describe("User Interactions", () => {
    it("calls onClose when close button is clicked", () => {
      const onClose = vi.fn();
      render(<DisputeRaiseModal {...defaultProps} onClose={onClose} />);
      
      fireEvent.click(screen.getByRole("button", { name: "Close" }));
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("calls onClose when cancel button is clicked", () => {
      const onClose = vi.fn();
      render(<DisputeRaiseModal {...defaultProps} onClose={onClose} />);
      
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("calls onConfirm when confirm button is clicked", () => {
      const onConfirm = vi.fn();
      render(<DisputeRaiseModal {...defaultProps} onConfirm={onConfirm} />);
      
      fireEvent.click(screen.getByRole("button", { name: "Raise Dispute" }));
      
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it("does not call onConfirm when isPending is true", () => {
      const onConfirm = vi.fn();
      render(
        <DisputeRaiseModal {...defaultProps} onConfirm={onConfirm} isPending={true} />
      );
      
      const confirmButton = screen.getByRole("button", { name: "Raising Dispute..." });
      fireEvent.click(confirmButton);
      
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it("updates reason textarea value on input", () => {
      render(<DisputeRaiseModal {...defaultProps} />);
      
      const textarea = screen.getByLabelText("Reason for dispute (optional)");
      fireEvent.change(textarea, { target: { value: "Work not delivered" } });
      
      expect(textarea).toHaveValue("Work not delivered");
    });

    it("clears reason textarea when close button is clicked", () => {
      const onClose = vi.fn();
      render(<DisputeRaiseModal {...defaultProps} onClose={onClose} />);
      
      const textarea = screen.getByLabelText("Reason for dispute (optional)");
      fireEvent.change(textarea, { target: { value: "Test reason" } });
      
      fireEvent.click(screen.getByRole("button", { name: "Close" }));
      
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("has role='dialog' on modal container", () => {
      render(<DisputeRaiseModal {...defaultProps} />);
      expect(
        screen.getByRole("dialog", { name: "Raise Dispute" })
      ).toBeInTheDocument();
    });

    it("has aria-label on modal container", () => {
      const { container } = render(
        <DisputeRaiseModal {...defaultProps} />
      );
      const modal = container.querySelector('[data-testid="dispute-raise-modal"]');
      expect(modal).toHaveAttribute("aria-label", "Raise Dispute");
    });

    it("has aria-modal='true' on modal container", () => {
      const { container } = render(
        <DisputeRaiseModal {...defaultProps} />
      );
      const modal = container.querySelector('[data-testid="dispute-raise-modal"]');
      expect(modal).toHaveAttribute("aria-modal", "true");
    });

    it("has aria-label on close button", () => {
      render(<DisputeRaiseModal {...defaultProps} />);
      expect(
        screen.getByRole("button", { name: "Close" })
      ).toHaveAttribute("aria-label", "Close");
    });

    it("has role='alert' on error message", () => {
      render(
        <DisputeRaiseModal
          {...defaultProps}
          errorMessage="Error occurred"
        />
      );
      const error = screen.getByText("Error occurred");
      expect(error).toHaveAttribute("role", "alert");
    });

    it("has aria-live='assertive' on error message", () => {
      render(
        <DisputeRaiseModal
          {...defaultProps}
          errorMessage="Error occurred"
        />
      );
      const error = screen.getByText("Error occurred");
      expect(error).toHaveAttribute("aria-live", "assertive");
    });

    it("disables textarea when isPending is true", () => {
      render(<DisputeRaiseModal {...defaultProps} isPending={true} />);
      const textarea = screen.getByLabelText("Reason for dispute (optional)");
      expect(textarea).toBeDisabled();
    });

    it("disables close button when isPending is true", () => {
      render(<DisputeRaiseModal {...defaultProps} isPending={true} />);
      const closeButton = screen.getByRole("button", { name: "Close" });
      expect(closeButton).toBeDisabled();
    });

    it("disables cancel button when isPending is true", () => {
      render(<DisputeRaiseModal {...defaultProps} isPending={true} />);
      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      expect(cancelButton).toBeDisabled();
    });

    it("disables confirm button when isPending is true", () => {
      render(<DisputeRaiseModal {...defaultProps} isPending={true} />);
      const confirmButton = screen.getByRole("button", { name: "Raising Dispute..." });
      expect(confirmButton).toBeDisabled();
    });
  });

  describe("Animation State Transitions", () => {
    it("applies smooth transition on modal open", () => {
      render(<DisputeRaiseModal {...defaultProps} />);
      const backdrop = screen.getByRole("dialog", { name: "Raise Dispute" });
      expect(backdrop).toHaveClass("animate-fade-in");
    });

    it("applies smooth transition on modal content slide-in", () => {
      render(<DisputeRaiseModal {...defaultProps} />);
      const content = screen.getByTestId("dispute-raise-modal-content");
      expect(content).toHaveClass("animate-slide-in");
    });

    it("applies error shake animation when error appears", () => {
      const { rerender } = render(
        <DisputeRaiseModal {...defaultProps} errorMessage={null} />
      );
      
      rerender(
        <DisputeRaiseModal
          {...defaultProps}
          errorMessage="New error"
        />
      );
      
      const error = screen.getByTestId("dispute-raise-modal-error");
      expect(error).toHaveClass("animate-shake");
    });

    it("maintains animation classes during re-renders", () => {
      const { rerender } = render(
        <DisputeRaiseModal {...defaultProps} />
      );
      
      rerender(<DisputeRaiseModal {...defaultProps} milestoneNumber={2} />);
      
      const backdrop = screen.getByRole("dialog", { name: "Raise Dispute" });
      const content = screen.getByTestId("dispute-raise-modal-content");
      
      expect(backdrop).toHaveClass("animate-fade-in");
      expect(content).toHaveClass("animate-slide-in");
    });
  });

  describe("Animation Duration and Timing", () => {
    it("uses transition duration of 200ms for buttons", () => {
      render(<DisputeRaiseModal {...defaultProps} />);
      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      expect(cancelButton).toHaveClass("duration-200");
    });

    it("uses transition duration of 200ms for textarea", () => {
      render(<DisputeRaiseModal {...defaultProps} />);
      const textarea = screen.getByLabelText("Reason for dispute (optional)");
      expect(textarea).toHaveClass("duration-200");
    });

    it("uses transition duration of 200ms for close button", () => {
      render(<DisputeRaiseModal {...defaultProps} />);
      const closeButton = screen.getByRole("button", { name: "Close" });
      expect(closeButton).toHaveClass("duration-200");
    });
  });
});
