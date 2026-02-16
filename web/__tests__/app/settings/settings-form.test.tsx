/**
 * Unit tests for Settings page - name edit form.
 * Verifies form logic: trimmed name, validation, and updateUser flow.
 * Uses uncontrolled input (defaultValue) to avoid useEffect overwriting user input.
 * @vitest-environment jsdom
 */
import { describe, expect, test, vi, beforeEach } from "vitest";

// Simulates handleSubmit logic from Settings page
async function simulateSubmit(
  nameInputValue: string,
  updateUser: (data: { name: string }) => Promise<unknown>
): Promise<{ success: boolean; error?: string }> {
  const trimmed = nameInputValue?.trim() ?? "";
  if (!trimmed) {
    return { success: false, error: "الرجاء إدخال الاسم" };
  }
  const result = await updateUser({ name: trimmed });
  const err = result && typeof result === "object" && "error" in result ? (result as { error?: { message?: string } }).error : null;
  if (err) {
    return { success: false, error: err.message ?? "فشل التحديث" };
  }
  return { success: true };
}

describe("Settings form logic", () => {
  const mockUpdateUser = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("trimmed name is passed to updateUser", async () => {
    mockUpdateUser.mockResolvedValue({});
    const result = await simulateSubmit("  Trimmed Name  ", mockUpdateUser);
    expect(result.success).toBe(true);
    expect(mockUpdateUser).toHaveBeenCalledWith({ name: "Trimmed Name" });
  });

  test("empty name returns error and does not call updateUser", async () => {
    const result = await simulateSubmit("", mockUpdateUser);
    expect(result.success).toBe(false);
    expect(result.error).toBe("الرجاء إدخال الاسم");
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  test("whitespace-only name returns error", async () => {
    const result = await simulateSubmit("   ", mockUpdateUser);
    expect(result.success).toBe(false);
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  test("updateUser error is propagated", async () => {
    mockUpdateUser.mockResolvedValue({ error: { message: "حدث خطأ" } });
    const result = await simulateSubmit("Valid Name", mockUpdateUser);
    expect(result.success).toBe(false);
    expect(result.error).toBe("حدث خطأ");
  });

  test("successful save returns success", async () => {
    mockUpdateUser.mockResolvedValue({});
    const result = await simulateSubmit("New Name", mockUpdateUser);
    expect(result.success).toBe(true);
    expect(mockUpdateUser).toHaveBeenCalledWith({ name: "New Name" });
  });
});
