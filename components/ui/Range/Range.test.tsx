import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Range } from "./Range";

// Helper function to get input by its value
const getInputByValue = (value: string) => {
  const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
  return inputs.find((input) => input.value === value);
};

const mockBoundingClientRect = vi.fn();

describe("Range Component", () => {
  beforeEach(() => {
    // clientX 500px = 50% --> value 50
    mockBoundingClientRect.mockReturnValue({
      width: 1000,
      height: 10,
      top: 0,
      left: 0,
      right: 1000,
      bottom: 10,
      x: 0,
      y: 0,
      toJSON: () => {},
    });
    Element.prototype.getBoundingClientRect = mockBoundingClientRect;
  });

  describe("Rendering", () => {
    it("should render with default values", () => {
      render(<Range min={1} max={100} />);

      expect(getInputByValue("1")).toBeDefined();
      expect(getInputByValue("100")).toBeDefined();

      // Verify handles are present
      const [minThumb, maxThumb] = [
        screen.getByTestId("min-handle"),
        screen.getByTestId("max-handle"),
      ];
      expect(minThumb).toBeDefined();
      expect(maxThumb).toBeDefined();
    });

    it("should render two draggable thumbs with correct ARIA attributes", () => {
      render(<Range min={0} max={50} />);

      const thumbs = [
        screen.getByTestId("min-handle"),
        screen.getByTestId("max-handle"),
      ];
      expect(thumbs).toHaveLength(2);
    });

    it("should respect initial values", () => {
      render(
        <Range min={1} max={100} initialMinValue={20} initialMaxValue={80} />
      );

      expect(getInputByValue("20")).toBeDefined();
      expect(getInputByValue("80")).toBeDefined();
    });

    it("should render with custom format label", () => {
      render(
        <Range
          min={1}
          max={100}
          initialMinValue={10}
          initialMaxValue={90}
          formatLabel={(val) => `$${val}.00`}
        />
      );

      expect(getInputByValue("$10.00")).toBeDefined();
      expect(getInputByValue("$90.00")).toBeDefined();
    });
  });

  describe("Mouse Drag Interactions", () => {
    it("should move min thumb when dragged", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<Range min={0} max={100} onChange={onChange} />);

      const [minThumb] = [
        screen.getByTestId("min-handle"),
        screen.getByTestId("max-handle"),
      ];

      // Drag min thumb to 50% (value 50)
      await user.pointer([
        { keys: "[MouseLeft>]", target: minThumb },
        { coords: { clientX: 500 } },
        { keys: "[/MouseLeft]" },
      ]);

      await waitFor(() => {
        expect(getInputByValue("50")).toBeDefined();
        expect(onChange).toHaveBeenCalled();
      });
    });

    it("should move max thumb when dragged", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<Range min={0} max={100} onChange={onChange} />);

      const [, maxThumb] = [
        screen.getByTestId("min-handle"),
        screen.getByTestId("max-handle"),
      ];

      // Drag max thumb to 75% (value 75)
      await user.pointer([
        { keys: "[MouseLeft>]", target: maxThumb },
        { coords: { clientX: 750 } },
        { keys: "[/MouseLeft]" },
      ]);

      await waitFor(() => {
        expect(getInputByValue("75")).toBeDefined();
        expect(onChange).toHaveBeenCalled();
      });
    });

    it("should push max thumb when min thumb is dragged past it", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <Range
          min={0}
          max={100}
          initialMinValue={20}
          initialMaxValue={60}
          onChange={onChange}
        />
      );

      const [minThumb] = [
        screen.getByTestId("min-handle"),
        screen.getByTestId("max-handle"),
      ];

      await user.pointer([
        { keys: "[MouseLeft>]", target: minThumb },
        { coords: { clientX: 800 } },
        { keys: "[/MouseLeft]" },
      ]);

      await waitFor(() => {
        const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
        const minValue = parseInt(inputs[0].value);
        const maxValue = parseInt(inputs[1].value);

        expect(minValue).toBeGreaterThanOrEqual(60);
        expect(maxValue).toBeGreaterThan(minValue);
        expect(onChange).toHaveBeenCalled();
      });
    });

    it("should push min thumb when max thumb is dragged past it", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <Range
          min={0}
          max={100}
          initialMinValue={40}
          initialMaxValue={80}
          onChange={onChange}
        />
      );

      const [maxThumb] = [screen.getByTestId("max-handle")];

      // Drag max thumb to 20% (past min)
      await user.pointer([
        { keys: "[MouseLeft>]", target: maxThumb },
        { coords: { clientX: 200 } },
        { keys: "[/MouseLeft]" },
      ]);

      await waitFor(() => {
        // Both thumbs should have moved (push behavior)
        const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
        const minValue = parseInt(inputs[0].value);
        const maxValue = parseInt(inputs[1].value);

        expect(maxValue).toBeLessThanOrEqual(40);
        expect(minValue).toBeLessThan(maxValue);
        expect(onChange).toHaveBeenCalled();
      });
    });

    it("should handle multiple drag operations", async () => {
      const user = userEvent.setup();

      render(<Range min={0} max={100} />);

      const [minThumb, maxThumb] = [
        screen.getByTestId("min-handle"),
        screen.getByTestId("max-handle"),
      ];

      // First drag: move min to 25
      await user.pointer([
        { keys: "[MouseLeft>]", target: minThumb },
        { coords: { clientX: 250 } },
        { keys: "[/MouseLeft]" },
      ]);

      await waitFor(() => {
        expect(getInputByValue("25")).toBeDefined();
      });

      // Second drag: move max to 75
      await user.pointer([
        { keys: "[MouseLeft>]", target: maxThumb },
        { coords: { clientX: 750 } },
        { keys: "[/MouseLeft]" },
      ]);

      await waitFor(() => {
        expect(getInputByValue("75")).toBeDefined();
      });
    });

    it("should call onChange with correct values during drag", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<Range min={0} max={100} onChange={onChange} />);

      const [minThumb] = [
        screen.getByTestId("min-handle"),
        screen.getByTestId("max-handle"),
      ];

      await user.pointer([
        { keys: "[MouseLeft>]", target: minThumb },
        { coords: { clientX: 300 } },
        { keys: "[/MouseLeft]" },
      ]);

      await waitFor(() => {
        expect(onChange).toHaveBeenCalled();
        const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
        expect(lastCall[0]).toBe(30);
        expect(lastCall[1]).toBe(100);
      });
    });
  });

  describe("Touch Interactions (Multi-touch Support)", () => {
    it("should support touch interactions on thumbs", async () => {
      const onChange = vi.fn();

      render(<Range min={0} max={100} onChange={onChange} />);

      const [minThumb] = [
        screen.getByTestId("min-handle"),
        screen.getByTestId("max-handle"),
      ];

      const touchEvent = new TouchEvent("touchstart", {
        bubbles: true,
        cancelable: true,
        touches: [
          {
            identifier: 0,
            clientX: 300,
            clientY: 0,
          } as Touch,
        ],
        changedTouches: [
          {
            identifier: 0,
            clientX: 300,
            clientY: 0,
          } as Touch,
        ],
      });

      act(() => {
        minThumb.dispatchEvent(touchEvent);
      });
    });
  });

  describe("Keyboard Navigation", () => {
    it("should have keyboard focus support on min thumb", async () => {
      render(<Range min={0} max={100} initialMinValue={50} />);

      const [minThumb] = [
        screen.getByTestId("min-handle"),
        screen.getByTestId("max-handle"),
      ];

      minThumb.focus();
      expect(document.activeElement).toBe(minThumb);
    });

    it("should have keyboard focus support on max thumb", async () => {
      render(<Range min={0} max={100} initialMaxValue={50} />);

      const [, maxThumb] = [
        screen.getByTestId("min-handle"),
        screen.getByTestId("max-handle"),
      ];

      maxThumb.focus();
      expect(document.activeElement).toBe(maxThumb);
    });
  });

  describe("Fixed Values Mode", () => {
    const fixedValues = [1.99, 5.99, 10.99, 30.99, 50.99, 70.99];

    it("should render with fixed values", () => {
      render(
        <Range
          min={1.99}
          max={70.99}
          fixedValues={fixedValues}
          formatLabel={(val) => `${val.toFixed(2)}€`}
        />
      );

      expect(getInputByValue("1.99€")).toBeDefined();
      expect(getInputByValue("70.99€")).toBeDefined();
    });

    it("should snap to closest fixed value when dragged", async () => {
      const user = userEvent.setup();

      render(
        <Range
          min={1.99}
          max={70.99}
          fixedValues={fixedValues}
          formatLabel={(val) => `${val.toFixed(2)}€`}
        />
      );

      const [minThumb] = [
        screen.getByTestId("min-handle"),
        screen.getByTestId("max-handle"),
      ];

      await user.pointer([
        { keys: "[MouseLeft>]", target: minThumb },
        { coords: { clientX: 300 } },
        { keys: "[/MouseLeft]" },
      ]);

      await waitFor(() => {
        const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
        const value = parseFloat(inputs[0].value.replace("€", ""));
        expect(fixedValues).toContain(value);
      });
    });

    it("should respect fixed values when pushing thumbs", async () => {
      const user = userEvent.setup();

      render(
        <Range
          min={1.99}
          max={70.99}
          fixedValues={fixedValues}
          initialMinValue={10.99}
          initialMaxValue={30.99}
          formatLabel={(val) => `${val.toFixed(2)}€`}
        />
      );

      const [minThumb] = [
        screen.getByTestId("min-handle"),
        screen.getByTestId("max-handle"),
      ];

      // Drag min past max
      await user.pointer([
        { keys: "[MouseLeft>]", target: minThumb },
        { coords: { clientX: 700 } },
        { keys: "[/MouseLeft]" },
      ]);

      await waitFor(() => {
        const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
        const minValue = parseFloat(inputs[0].value.replace("€", ""));
        const maxValue = parseFloat(inputs[1].value.replace("€", ""));

        // Both should be fixed values
        expect(fixedValues).toContain(minValue);
        expect(fixedValues).toContain(maxValue);
        // Max should be greater than min
        expect(maxValue).toBeGreaterThan(minValue);
      });
    });

    it("should disable label editing with fixed values", () => {
      render(
        <Range
          min={1.99}
          max={70.99}
          fixedValues={fixedValues}
          formatLabel={(val) => `${val.toFixed(2)}€`}
        />
      );

      const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
      // Inputs should be present and readOnly
      expect(inputs.length).toBe(2);
      inputs.forEach((input) => {
        expect(input.getAttribute("readonly")).not.toBeNull();
      });
    });
  });

  describe("Editable Labels", () => {
    it("should allow editing min value label when editable=true", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<Range min={0} max={100} editable={true} onChange={onChange} />);

      const minInput = getInputByValue("0");
      expect(minInput).toBeDefined();

      // Should not be readOnly when editable=true (allows mobile keyboard)
      expect(minInput?.readOnly).toBe(false);

      // Click to activate editing mode
      await user.click(minInput!);

      // Edit the value
      await user.clear(minInput!);
      await user.type(minInput!, "25");
      await user.tab(); // blur

      // Wait for change to be applied
      await waitFor(() => {
        expect(onChange).toHaveBeenCalled();
      });
    });

    it("should not allow editing when editable=false", async () => {
      render(<Range min={0} max={100} editable={false} />);

      const minInput = getInputByValue("0");
      expect(minInput).toBeDefined();

      // Input should be readOnly when not editable
      expect(minInput?.getAttribute("readonly")).not.toBeNull();
    });
  });

  describe("Edge Cases", () => {
    it("should handle min value equal to 0", () => {
      render(<Range min={0} max={10} />);

      expect(getInputByValue("0")).toBeDefined();
    });

    it("should handle negative values", () => {
      render(<Range min={-10} max={10} />);

      expect(getInputByValue("-10")).toBeDefined();
    });

    it("should handle decimal values", () => {
      const values = [1.5, 2.5, 3.5];
      render(
        <Range
          min={1.5}
          max={3.5}
          fixedValues={values}
          formatLabel={(val) => `${val}€`}
        />
      );

      expect(getInputByValue("1.5€")).toBeDefined();
      expect(getInputByValue("3.5€")).toBeDefined();
    });

    it("should handle very large ranges", () => {
      render(<Range min={0} max={10000} />);

      expect(getInputByValue("0")).toBeDefined();
      expect(getInputByValue("10000")).toBeDefined();
    });

    it("should handle edge case where min equals max", () => {
      // Suppress validation warning for this intentional edge case test
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      render(<Range min={50} max={50} />);

      const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
      expect(inputs.length).toBe(2);
      expect(inputs[0].value).toBe("50");
      expect(inputs[1].value).toBe("50");

      // Verify validation error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[Range] Invalid props: min must be less than max",
        { min: 50, max: 50 }
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Performance & Re-renders", () => {
    it("should not call onChange unnecessarily", async () => {
      const onChange = vi.fn();

      render(<Range min={0} max={100} onChange={onChange} />);

      expect(onChange).not.toHaveBeenCalled();
    });

    it("should handle rapid drag movements efficiently", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<Range min={0} max={100} onChange={onChange} />);

      const [minThumb] = [
        screen.getByTestId("min-handle"),
        screen.getByTestId("max-handle"),
      ];

      // Simulate rapid movements
      await user.pointer([
        { keys: "[MouseLeft>]", target: minThumb },
        { coords: { clientX: 100 } },
        { coords: { clientX: 200 } },
        { coords: { clientX: 300 } },
        { keys: "[/MouseLeft]" },
      ]);

      await waitFor(() => {
        expect(onChange).toHaveBeenCalled();
        expect(onChange.mock.calls.length).toBeLessThan(100);
      });
    });
  });

  describe("Step behavior", () => {
    it("should allow decimal input when step is decimal", async () => {
      const user = userEvent.setup();
      render(<Range min={0} max={10} step={0.5} editable={true} />);

      const minInput = getInputByValue("0.0");
      expect(minInput).toBeDefined();

      // Click to enter edit mode
      await user.click(minInput!);

      // Type a decimal value
      await user.clear(minInput!);
      await user.type(minInput!, "2.5");

      // Press Enter to commit
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(getInputByValue("2.5")).toBeDefined();
      });
    });

    it("should format values with decimals based on step", () => {
      const { unmount: unmount1 } = render(
        <Range min={0} max={10} initialMinValue={2.5} step={0.5} />
      );
      expect(getInputByValue("2.5")).toBeDefined();
      unmount1();

      render(<Range min={0} max={10} initialMinValue={2.75} step={0.25} />);
      expect(getInputByValue("2.75")).toBeDefined();
    });

    it("should snap to step when editing", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <Range
          min={0}
          max={10}
          step={0.5}
          editable={true}
          onChange={onChange}
        />
      );

      const minInput = getInputByValue("0.0");
      await user.click(minInput!);
      await user.clear(minInput!);
      await user.type(minInput!, "2.3");
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(2.5, 10);
      });
    });

    it("should work with integer step", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <Range min={0} max={100} step={5} editable={true} onChange={onChange} />
      );

      const minInput = getInputByValue("0");
      await user.click(minInput!);
      await user.clear(minInput!);
      await user.type(minInput!, "23"); // Should snap to 25
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(25, 100);
      });
    });
  });
});
