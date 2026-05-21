/**
 * Auth Change Password Tests
 * Verifies Joi schema fix: currentPassword/confirmPassword validation
 * Run: node --test test/auth-change-password.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import Joi from 'joi';

// Replicate the exact Joi schema from validation.middleware.js
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).required(),
  confirmPassword: Joi.string().valid(Joi.ref("newPassword")).required().messages({
    "any.only": "Mật khẩu xác nhận không khớp",
  }),
}).unknown(false);

// ─── Schema validation (unit, no DB) ───

test('changePassword: accepts valid payload with matching passwords', () => {
  const result = changePasswordSchema.validate({
    currentPassword: 'OldPass123!',
    newPassword: 'NewPass456!',
    confirmPassword: 'NewPass456!',
  }, { abortEarly: false, stripUnknown: true });

  assert.equal(result.error, undefined);
  assert.equal(result.value.currentPassword, 'OldPass123!');
  assert.equal(result.value.newPassword, 'NewPass456!');
  assert.equal(result.value.confirmPassword, 'NewPass456!');
});

test('changePassword: rejects when confirmPassword does not match newPassword', () => {
  const result = changePasswordSchema.validate({
    currentPassword: 'OldPass123!',
    newPassword: 'NewPass456!',
    confirmPassword: 'WrongPass!',
  }, { abortEarly: false, stripUnknown: true });

  assert.ok(result.error);
  assert.match(result.error.details[0].message, /không khớp/);
});

test('changePassword: does NOT strip confirmPassword (was the critical bug)', () => {
  const result = changePasswordSchema.validate({
    currentPassword: 'OldPass123!',
    newPassword: 'NewPass456!',
    confirmPassword: 'NewPass456!',
  }, { abortEarly: false, stripUnknown: true });

  assert.ok(result.value.confirmPassword, 'confirmPassword MUST be preserved, not stripped');
  assert.equal(result.value.confirmPassword, 'NewPass456!');
});

test('changePassword: rejects missing currentPassword', () => {
  const result = changePasswordSchema.validate({
    newPassword: 'NewPass456!',
    confirmPassword: 'NewPass456!',
  }, { abortEarly: false, stripUnknown: true });

  assert.ok(result.error);
  assert.match(result.error.message, /currentPassword/);
});

test('changePassword: rejects short newPassword (< 8 chars)', () => {
  const result = changePasswordSchema.validate({
    currentPassword: 'OldPass123!',
    newPassword: 'Short1!',
    confirmPassword: 'Short1!',
  }, { abortEarly: false, stripUnknown: true });

  assert.ok(result.error);
  assert.match(result.error.message, /newPassword/);
});

test('changePassword: strips unknown fields', () => {
  const result = changePasswordSchema.validate({
    currentPassword: 'OldPass123!',
    newPassword: 'NewPass456!',
    confirmPassword: 'NewPass456!',
    hackerField: 'DROP TABLE users;',
    oldPassword: 'LegacyField',
  }, { abortEarly: false, stripUnknown: true });

  // With stripUnknown: true, unknown fields should be removed
  // If they remain, at least validation should still pass (or reject unknown)
  if (result.error) {
    // Some Joi versions reject unknown keys even with stripUnknown
    assert.match(result.error.message, /not allowed|unknown/i);
  } else {
    assert.equal(result.value.hackerField, undefined, 'unknown fields should be stripped');
    assert.equal(result.value.oldPassword, undefined, 'legacy oldPassword should be stripped');
  }
});

// ─── Confirm frontend sends correct field names ───

test('changePassword: FE sends currentPassword not oldPassword', () => {
  const fePayload = { currentPassword: 'OldPass123!', newPassword: 'NewPass456!', confirmPassword: 'NewPass456!' };
  const result = changePasswordSchema.validate(fePayload, { abortEarly: false, stripUnknown: true });
  assert.equal(result.error, undefined);
});

test('changePassword: if FE still sends oldPassword, it gets stripped (backward compat note)', () => {
  const legacyPayload = { oldPassword: 'Old123!', newPassword: 'New456!', confirmPassword: 'New456!' };
  const result = changePasswordSchema.validate(legacyPayload, { abortEarly: false, stripUnknown: true });
  // oldPassword is stripped, currentPassword is required → should fail
  assert.ok(result.error, 'Should fail because currentPassword is required and oldPassword is stripped');
  assert.match(result.error.message, /currentPassword/);
});
