import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Range } from "./Range";

const mockBoundingClientRect = vi.fn();

describe("Range2 Component", () => {
  beforeEach(() => {
    // clientX 500px = 50% --> value 50 (for min 0, max 100)
    mockBoundingClientRect.mockReturnValue({
      width: 1000,
      height: 1000,
      top: 0,
      left: 0,
      right: 1000,
      bottom: 1000,
      x: 0,
      y: 0,
      toJSON: () => {},
    });
    Element.prototype.getBoundingClientRect = mockBoundingClientRect;
  });

  describe("Rendering", () => {
    it("should render with required props (controlled)", () => {
      render(<Range defaultValue={[0, 100]} min={0} max={100} />);

      const container = screen.getByTestId("range-container");
      expect(container).toBeDefined();
    });

    it("should render with default orientation (horizontal)", () => {
      const { container } = render(
        <Range defaultValue={[0, 100]} min={0} max={100} />
      );

      const rangeContainer = container.querySelector(
        '[data-testid="range-container"]'
      );
      expect(rangeContainer?.className).toContain("horizontal");
    });

    it("should render in vertical orientation", () => {
      const { container } = render(
        <Range
          defaultValue={[0, 100]}
          min={0}
          max={100}
          orientation="vertical"
        />
      );

      const rangeContainer = container.querySelector(
        '[data-testid="range-container"]'
      );
      expect(rangeContainer?.className).toContain("vertical");
    });

    it("should render inputs when showInputs is true", () => {
      render(
        <Range defaultValue={[25, 75]} min={0} max={100} showInputs />
      );

      const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
      expect(inputs).toHaveLength(2);
      expect(inputs[0].value).toBe("25");
      expect(inputs[1].value).toBe("75");
    });

    it("should not render inputs when showInputs is false", () => {
      render(<Range defaultValue={[25, 75]} min={0} max={100} />);

      const inputs = screen.queryAllByRole("textbox");
      expect(inputs).toHaveLength(0);
    });

    it("should render with custom format label", () => {
      render(
        <Range
          defaultValue={[10, 90]}
          min={0}
          max={100}
          showInputs
          formatLabel={(val) => `€${val}`}
        />
      );

      const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
      // When not focused, should show formatted value
      expect(inputs[0].value).toBe("€10");
      expect(inputs[1].value).toBe("€90");
    });
  });

  describe("Controlled Component Behavior", () => {
    it("should update when props change", () => {
      const { rerender } = render(
        <Range value={[0, 100]} min={0} max={100} showInputs />
      );

      const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
      expect(inputs[0].value).toBe("0");
      expect(inputs[1].value).toBe("100");

      // Update props
      rerender(
        <Range value={[25, 75]} min={0} max={100} showInputs />
      );

      const updatedInputs = screen.getAllByRole(
        "textbox"
      ) as HTMLInputElement[];
      expect(updatedInputs[0].value).toBe("25");
      expect(updatedInputs[1].value).toBe("75");
    });

    it("should call onChange when values are modified", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <Range
          defaultValue={[0, 100]}
          min={0}
          max={100}
          showInputs
          onChange={onChange}
        />
      );

      const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
      await user.clear(inputs[0]);
      await user.type(inputs[0], "25");
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith([25, 100]);
      });
    });
  });

  describe("Input Editing", () => {
    it("should allow editing min value input", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <Range
          defaultValue={[0, 100]}
          min={0}
          max={100}
          showInputs
          onChange={onChange}
        />
      );

      const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
      await user.clear(inputs[0]);
      await user.type(inputs[0], "30");
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith([30, 100]);
      });
    });

    it("should allow editing max value input", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <Range
          defaultValue={[0, 100]}
          min={0}
          max={100}
          showInputs
          onChange={onChange}
        />
      );

      const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
      await user.clear(inputs[1]);
      await user.type(inputs[1], "80");
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith([0, 80]);
      });
    });

    it("should apply value on blur", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <Range
          defaultValue={[0, 100]}
          min={0}
          max={100}
          showInputs
          onChange={onChange}
        />
      );

      const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
      await user.clear(inputs[0]);
      await user.type(inputs[0], "40");
      await user.tab(); // blur

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith([40, 100]);
      });
    });

    it("should clamp value to min/max boundaries", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <Range
          defaultValue={[0, 100]}
          min={0}
          max={100}
          showInputs
          onChange={onChange}
        />
      );

      const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];

      // Try to set below min
      await user.clear(inputs[0]);
      await user.type(inputs[0], "-10");
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith([0, 100]);
      });

      // Try to set above max
      onChange.mockClear();
      await user.clear(inputs[1]);
      await user.type(inputs[1], "150");
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith([0, 100]);
      });
    });

    it("should respect step when editing", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <Range
          defaultValue={[0, 100]}
          min={0}
          max={100}
          step={5}
          showInputs
          onChange={onChange}
        />
      );

      const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
      await user.clear(inputs[0]);
      await user.type(inputs[0], "23"); // Should snap to 25
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith([25, 100]);
      });
    });

    it("should disable inputs when disabledInputs is true", () => {
      render(
        <Range
          defaultValue={[0, 100]}
          min={0}
          max={100}
          showInputs
          disabledInputs
        />
      );

      const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
      expect(inputs[0].disabled).toBe(true);
      expect(inputs[1].disabled).toBe(true);
    });

    it("should disable inputs when disabled is true", () => {
      render(
        <Range
          defaultValue={[0, 100]}
          min={0}
          max={100}
          showInputs
          disabled
        />
      );

      const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
      expect(inputs[0].disabled).toBe(true);
      expect(inputs[1].disabled).toBe(true);
    });
  });

  describe("AllowPush Behavior", () => {
    it("should push max when min exceeds it (allowPush=true)", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <Range
          defaultValue={[20, 60]}
          min={0}
          max={100}
          showInputs
          allowPush={true}
          onChange={onChange}
        />
      );

      const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
      await user.clear(inputs[0]);
      await user.type(inputs[0], "80");
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith([80, 80]);
      });
    });

    it("should push min when max goes below it (allowPush=true)", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <Range
          defaultValue={[40, 80]}
          min={0}
          max={100}
          showInputs
          allowPush={true}
          onChange={onChange}
        />
      );

      const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
      await user.clear(inputs[1]);
      await user.type(inputs[1], "20");
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith([20, 20]);
      });
    });

    it("should clamp min to max when allowPush=false", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <Range
          defaultValue={[20, 60]}
          min={0}
          max={100}
          showInputs
          allowPush={false}
          onChange={onChange}
        />
      );

      const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
      await user.clear(inputs[0]);
      await user.type(inputs[0], "80");
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith([60, 60]);
      });
    });

    it("should clamp max to min when allowPush=false", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <Range
          defaultValue={[40, 80]}
          min={0}
          max={100}
          showInputs
          allowPush={false}
          onChange={onChange}
        />
      );

      const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
      await user.clear(inputs[1]);
      await user.type(inputs[1], "20");
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith([40, 40]);
      });
    });
  });

  describe("Fixed Values Mode", () => {
    const fixedValues = [0, 25, 50, 100, 250, 500, 750, 1000];

    it("should render with fixed values", () => {
      render(
        <Range
          defaultValue={[0, 1000]}
          fixedValues={fixedValues}
          showInputs
        />
      );

      const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
      expect(inputs).toHaveLength(2);
      expect(inputs[0].value).toBe("0");
      expect(inputs[1].value).toBe("1000");
    });

    it("should snap to closest fixed value when editing", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <Range
          defaultValue={[0, 1000]}
          fixedValues={fixedValues}
          showInputs
          onChange={onChange}
        />
      );

      const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
      await user.clear(inputs[0]);
      await user.type(inputs[0], "60"); // Should snap to 50
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith([50, 1000]);
      });
    });

    it("should snap to closest fixed value when typing higher value", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <Range
          defaultValue={[0, 1000]}
          fixedValues={fixedValues}
          showInputs
          onChange={onChange}
        />
      );

      const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
      await user.clear(inputs[0]);
      await user.type(inputs[0], "300"); // Should snap to 250
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith([250, 1000]);
      });
    });

    it("should clamp to array boundaries", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <Range
          defaultValue={[0, 1000]}
          fixedValues={fixedValues}
          showInputs
          onChange={onChange}
        />
      );

      const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];

      // Try value below minimum
      await user.clear(inputs[0]);
      await user.type(inputs[0], "-100");
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith([0, 1000]);
      });

      // Try value above maximum
      onChange.mockClear();
      await user.clear(inputs[1]);
      await user.type(inputs[1], "5000");
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith([0, 1000]);
      });
    });

    it("should work with formatLabel in fixed values mode", async () => {
      const user = userEvent.setup();

      render(
        <Range
          defaultValue={[0, 1000]}
          fixedValues={fixedValues}
          showInputs
          formatLabel={(val) => `€${val}`}
        />
      );

      const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
      // When not focused, should show formatted
      expect(inputs[0].value).toBe("€0");
      expect(inputs[1].value).toBe("€1000");

      // When focused, should show raw value for editing
      await user.click(inputs[0]);
      await waitFor(() => {
        expect(inputs[0].value).toBe("0");
      });
    });

    it("should respect allowPush in fixed values mode", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <Range
          defaultValue={[100, 500]}
          fixedValues={fixedValues}
          showInputs
          allowPush={true}
          onChange={onChange}
        />
      );

      const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
      await user.clear(inputs[0]);
      await user.type(inputs[0], "800"); // Should snap to 750 and push max
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith([750, 750]);
      });
    });

    it("should clamp to other thumb in fixed values when allowPush=false", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <Range
          defaultValue={[100, 500]}
          fixedValues={fixedValues}
          showInputs
          allowPush={false}
          onChange={onChange}
        />
      );

      const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
      await user.clear(inputs[0]);
      await user.type(inputs[0], "800");
      await user.keyboard("{Enter}");

      await waitFor(() => {
        // Should clamp to maxValue (500)
        expect(onChange).toHaveBeenCalledWith([500, 500]);
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle min value equal to 0", () => {
      render(<Range defaultValue={[0, 10]} min={0} max={10} showInputs />);

      const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
      expect(inputs[0].value).toBe("0");
    });

    it("should handle negative values", () => {
      render(
        <Range defaultValue={[-10, 10]} min={-10} max={10} showInputs />
      );

      const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
      expect(inputs[0].value).toBe("-10");
      expect(inputs[1].value).toBe("10");
    });

    it("should handle decimal values with step", () => {
      render(
        <Range
          defaultValue={[1.5, 3.5]}
          min={0}
          max={5}
          step={0.5}
          showInputs
        />
      );

      const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
      expect(inputs[0].value).toBe("1.5");
      expect(inputs[1].value).toBe("3.5");
    });

    it("should handle very large ranges", () => {
      render(
        <Range defaultValue={[0, 10000]} min={0} max={10000} showInputs />
      );

      const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
      expect(inputs[0].value).toBe("0");
      expect(inputs[1].value).toBe("10000");
    });

    it("should handle invalid input gracefully", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <Range
          defaultValue={[0, 100]}
          min={0}
          max={100}
          showInputs
          onChange={onChange}
        />
      );

      const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
      await user.clear(inputs[0]);
      await user.type(inputs[0], "abc");
      await user.keyboard("{Enter}");

      // Should revert to previous value
      await waitFor(() => {
        expect(inputs[0].value).toBe("0");
        expect(onChange).not.toHaveBeenCalled();
      });
    });
  });

  describe("ThumbGap Feature", () => {
    it("should render with thumbGap", () => {
      render(
        <Range defaultValue={[50, 50]} min={0} max={100} thumbGap={5} />
      );

      const container = screen.getByTestId("range-container");
      expect(container).toBeDefined();
    });

    it("should maintain visual separation when values are equal", () => {
      render(
        <Range
          defaultValue={[50, 50]}
          min={0}
          max={100}
          thumbGap={10}
          showInputs
        />
      );

      const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
      // Values should still be equal
      expect(inputs[0].value).toBe("50");
      expect(inputs[1].value).toBe("50");
    });
  });

  describe("Disabled State", () => {
    it("should disable all interactions when disabled=true", () => {
      render(
        <Range
          defaultValue={[0, 100]}
          min={0}
          max={100}
          showInputs
          disabled
        />
      );

      const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
      expect(inputs[0].disabled).toBe(true);
      expect(inputs[1].disabled).toBe(true);
    });

    it("should not call onChange when disabled", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <Range
          defaultValue={[0, 100]}
          min={0}
          max={100}
          showInputs
          disabled
          onChange={onChange}
        />
      );

      const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];

      // Try to edit - should not work because disabled
      await user.click(inputs[0]);

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe("Keyboard Navigation", () => {
    it("should move min thumb to minimum on Home key", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <Range
          defaultValue={[50, 100]}
          min={0}
          max={100}
          onChange={onChange}
        />
      );

      const minThumb = screen.getByTestId("range-thumb-min-handle");
      minThumb.focus();
      await user.keyboard("{Home}");

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith([0, 100]);
      });
    });

    it("should move min thumb to maximum on End key", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <Range
          defaultValue={[0, 100]}
          min={0}
          max={100}
          allowPush={true}
          onChange={onChange}
        />
      );

      const minThumb = screen.getByTestId("range-thumb-min-handle");
      minThumb.focus();
      await user.keyboard("{End}");

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith([100, 100]);
      });
    });

    it("should move max thumb to maximum on End key", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <Range
          defaultValue={[0, 50]}
          min={0}
          max={100}
          onChange={onChange}
        />
      );

      const maxThumb = screen.getByTestId("range-thumb-max-handle");
      maxThumb.focus();
      await user.keyboard("{End}");

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith([0, 100]);
      });
    });

    it("should move max thumb to minimum on Home key", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <Range
          defaultValue={[0, 100]}
          min={0}
          max={100}
          allowPush={true}
          onChange={onChange}
        />
      );

      const maxThumb = screen.getByTestId("range-thumb-max-handle");
      maxThumb.focus();
      await user.keyboard("{Home}");

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith([0, 0]);
      });
    });

    it("should increment min thumb value on ArrowUp", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <Range
          defaultValue={[40, 80]}
          min={0}
          max={100}
          step={10}
          onChange={onChange}
        />
      );

      const minThumb = screen.getByTestId("range-thumb-min-handle");
      minThumb.focus();
      await user.keyboard("{ArrowUp}");

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith([50, 80]);
      });
    });

    it("should increment min thumb value on ArrowRight", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <Range
          defaultValue={[40, 80]}
          min={0}
          max={100}
          step={10}
          onChange={onChange}
        />
      );

      const minThumb = screen.getByTestId("range-thumb-min-handle");
      minThumb.focus();
      await user.keyboard("{ArrowRight}");

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith([50, 80]);
      });
    });

    it("should decrement min thumb value on ArrowDown", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <Range
          defaultValue={[40, 80]}
          min={0}
          max={100}
          step={10}
          onChange={onChange}
        />
      );

      const minThumb = screen.getByTestId("range-thumb-min-handle");
      minThumb.focus();
      await user.keyboard("{ArrowDown}");

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith([30, 80]);
      });
    });

    it("should decrement min thumb value on ArrowLeft", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <Range
          defaultValue={[40, 80]}
          min={0}
          max={100}
          step={10}
          onChange={onChange}
        />
      );

      const minThumb = screen.getByTestId("range-thumb-min-handle");
      minThumb.focus();
      await user.keyboard("{ArrowLeft}");

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith([30, 80]);
      });
    });

    it("should increment max thumb value on ArrowUp", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <Range
          defaultValue={[20, 60]}
          min={0}
          max={100}
          step={10}
          onChange={onChange}
        />
      );

      const maxThumb = screen.getByTestId("range-thumb-max-handle");
      maxThumb.focus();
      await user.keyboard("{ArrowUp}");

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith([20, 70]);
      });
    });

    it("should decrement max thumb value on ArrowDown", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <Range
          defaultValue={[20, 60]}
          min={0}
          max={100}
          step={10}
          onChange={onChange}
        />
      );

      const maxThumb = screen.getByTestId("range-thumb-max-handle");
      maxThumb.focus();
      await user.keyboard("{ArrowDown}");

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith([20, 50]);
      });
    });

    it("should not exceed max value when incrementing min thumb", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <Range
          defaultValue={[90, 100]}
          min={0}
          max={100}
          step={10}
          allowPush={false}
          onChange={onChange}
        />
      );

      const minThumb = screen.getByTestId("range-thumb-min-handle");
      minThumb.focus();
      await user.keyboard("{ArrowUp}");

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith([100, 100]);
      });
    });

    it("should not go below min value when decrementing min thumb", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <Range
          defaultValue={[0, 50]}
          min={0}
          max={100}
          step={10}
          onChange={onChange}
        />
      );

      const minThumb = screen.getByTestId("range-thumb-min-handle");
      minThumb.focus();
      await user.keyboard("{ArrowDown}");

      // Should stay at 0 (already at minimum)
      expect(onChange).not.toHaveBeenCalled();
    });

    it("should push max value when min increments beyond it (allowPush=true)", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <Range
          defaultValue={[90, 100]}
          min={0}
          max={100}
          step={10}
          allowPush={true}
          onChange={onChange}
        />
      );

      const minThumb = screen.getByTestId("range-thumb-min-handle");
      minThumb.focus();
      await user.keyboard("{ArrowUp}");

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith([100, 100]);
      });
    });

    it("should push min value when max decrements below it (allowPush=true)", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <Range
          defaultValue={[0, 10]}
          min={0}
          max={100}
          step={10}
          allowPush={true}
          onChange={onChange}
        />
      );

      const maxThumb = screen.getByTestId("range-thumb-max-handle");
      maxThumb.focus();
      await user.keyboard("{ArrowDown}");

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith([0, 0]);
      });
    });

    it("should work with fixed values array", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const fixedValues = [0, 25, 50, 75, 100];

      render(
        <Range
          defaultValue={[25, 75]}
          fixedValues={fixedValues}
          onChange={onChange}
        />
      );

      const minThumb = screen.getByTestId("range-thumb-min-handle");
      minThumb.focus();
      await user.keyboard("{ArrowUp}");

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith([50, 75]);
      });
    });

    it("should navigate to next fixed value on increment", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const fixedValues = [0, 10, 25, 50, 100, 500, 1000];

      render(
        <Range
          defaultValue={[10, 1000]}
          fixedValues={fixedValues}
          onChange={onChange}
        />
      );

      const minThumb = screen.getByTestId("range-thumb-min-handle");
      minThumb.focus();
      await user.keyboard("{ArrowUp}");

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith([25, 1000]);
      });
    });

    it("should navigate to previous fixed value on decrement", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const fixedValues = [0, 10, 25, 50, 100, 500, 1000];

      render(
        <Range
          defaultValue={[50, 1000]}
          fixedValues={fixedValues}
          onChange={onChange}
        />
      );

      const minThumb = screen.getByTestId("range-thumb-min-handle");
      minThumb.focus();
      await user.keyboard("{ArrowDown}");

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith([25, 1000]);
      });
    });

    it("should not navigate when at first fixed value and decrementing", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const fixedValues = [0, 25, 50, 75, 100];

      render(
        <Range
          defaultValue={[0, 100]}
          fixedValues={fixedValues}
          onChange={onChange}
        />
      );

      const minThumb = screen.getByTestId("range-thumb-min-handle");
      minThumb.focus();
      await user.keyboard("{ArrowDown}");

      // Should stay at 0 (first fixed value)
      expect(onChange).not.toHaveBeenCalled();
    });

    it("should not navigate when at last fixed value and incrementing", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const fixedValues = [0, 25, 50, 75, 100];

      render(
        <Range
          defaultValue={[0, 100]}
          fixedValues={fixedValues}
          onChange={onChange}
        />
      );

      const maxThumb = screen.getByTestId("range-thumb-max-handle");
      maxThumb.focus();
      await user.keyboard("{ArrowUp}");

      // Should stay at 100 (last fixed value)
      expect(onChange).not.toHaveBeenCalled();
    });

    it("should not handle keyboard events when disabled", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <Range
          defaultValue={[40, 80]}
          min={0}
          max={100}
          step={10}
          disabled
          onChange={onChange}
        />
      );

      const minThumb = screen.getByTestId("range-thumb-min-handle");
      minThumb.focus();
      await user.keyboard("{ArrowUp}");

      expect(onChange).not.toHaveBeenCalled();
    });

    it("should support Tab navigation between thumbs", async () => {
      const user = userEvent.setup();

      render(<Range defaultValue={[25, 75]} min={0} max={100} />);

      const minThumb = screen.getByTestId("range-thumb-min-handle");
      const maxThumb = screen.getByTestId("range-thumb-max-handle");

      minThumb.focus();
      expect(document.activeElement).toBe(minThumb);

      await user.keyboard("{Tab}");

      expect(document.activeElement).toBe(maxThumb);
    });

    it("should support Shift+Tab navigation between thumbs", async () => {
      const user = userEvent.setup();

      render(<Range defaultValue={[25, 75]} min={0} max={100} />);

      const minThumb = screen.getByTestId("range-thumb-min-handle");
      const maxThumb = screen.getByTestId("range-thumb-max-handle");

      maxThumb.focus();
      expect(document.activeElement).toBe(maxThumb);

      await user.keyboard("{Shift>}{Tab}{/Shift}");

      expect(document.activeElement).toBe(minThumb);
    });

    it("should blur thumbs when dragging starts with mouse", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <Range
          defaultValue={[25, 75]}
          min={0}
          max={100}
          onChange={onChange}
        />
      );

      const minThumb = screen.getByTestId("range-thumb-min-handle");

      // Focus with keyboard
      minThumb.focus();
      expect(document.activeElement).toBe(minThumb);

      // Start dragging with mouse
      await user.pointer({ keys: "[MouseLeft>]", target: minThumb });

      // Thumb should lose focus when dragging
      await waitFor(() => {
        expect(document.activeElement).not.toBe(minThumb);
      });
    });

    it("should handle multiple keyboard presses in sequence", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <Range
          defaultValue={[50, 80]}
          min={0}
          max={100}
          step={10}
          onChange={onChange}
        />
      );

      const minThumb = screen.getByTestId("range-thumb-min-handle");
      minThumb.focus();

      // Press ArrowUp multiple times
      await user.keyboard("{ArrowUp}");
      await user.keyboard("{ArrowUp}");
      await user.keyboard("{ArrowUp}");

      await waitFor(() => {
        // 50 -> 60 -> 70 -> 80
        expect(onChange).toHaveBeenLastCalledWith([80, 80]);
      });
    });
  });
});
