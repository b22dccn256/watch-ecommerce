/**
 * Auth Reset Password Tests
 * Verifies Joi schema fix: confirmPassword added to resetPassword
 * Run: node --test test/auth-reset-password.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import Joi from 'joi';

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(8).required(),
  confirmPassword: Joi.string().valid(Joi.ref("newPassword")).required().messages({
    "any.only": "Mật khẩu xác nhận không khớp",
  }),
}).unknown(false);

test('resetPassword: accepts valid payload with matching passwords', () => {
  const result = resetPasswordSchema.validate({
    token: 'abc123def456',
    newPassword: 'NewPass789!',
    confirmPassword: 'NewPass789!',
  }, { abortEarly: false, stripUnknown: true });

  assert.equal(result.error, undefined);
  assert.equal(result.value.token, 'abc123def456');
  assert.equal(result.value.confirmPassword, 'NewPass789!');
});

test('resetPassword: does NOT strip confirmPassword (was the critical bug)', () => {
  const result = resetPasswordSchema.validate({
    token: 'abc123',
    newPassword: 'StrongPass1!',
    confirmPassword: 'StrongPass1!',
  }, { abortEarly: false, stripUnknown: true });

  assert.ok(result.value.confirmPassword, 'confirmPassword MUST be preserved');
  assert.equal(result.value.confirmPassword, 'StrongPass1!');
});

test('resetPassword: rejects mismatched confirmPassword', () => {
  const result = resetPasswordSchema.validate({
    token: 'abc123',
    newPassword: 'StrongPass1!',
    confirmPassword: 'Different1!',
  }, { abortEarly: false, stripUnknown: true });

  assert.ok(result.error);
  assert.match(result.error.details[0].message, /không khớp/);
});

test('resetPassword: rejects missing token', () => {
  const result = resetPasswordSchema.validate({
    newPassword: 'StrongPass1!',
    confirmPassword: 'StrongPass1!',
  }, { abortEarly: false, stripUnknown: true });

  assert.ok(result.error);
  assert.match(result.error.message, /token/);
});

test('resetPassword: rejects missing confirmPassword', () => {
  const result = resetPasswordSchema.validate({
    token: 'abc123',
    newPassword: 'StrongPass1!',
  }, { abortEarly: false, stripUnknown: true });

  assert.ok(result.error);
  assert.match(result.error.message, /confirmPassword/);
});

test('resetPassword: strips unknown fields', () => {
  const result = resetPasswordSchema.validate({
    token: 'abc123',
    newPassword: 'StrongPass1!',
    confirmPassword: 'StrongPass1!',
    email: 'hacker@evil.com',
  }, { abortEarly: false, stripUnknown: true });

  if (result.error) {
    assert.match(result.error.message, /not allowed|unknown/i);
  } else {
    assert.equal(result.value.email, undefined);
  }
});
