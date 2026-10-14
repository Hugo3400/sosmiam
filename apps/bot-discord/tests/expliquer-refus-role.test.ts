import assert from "node:assert/strict";
import { test } from "node:test";
import { PermissionFlagsBits, PermissionsBitField, type Role } from "discord.js";
import { expliquerRefusRole } from "../src/fonctions/discord/expliquer-refus-role.ts";

function faireRole(droits: bigint, autres: Partial<{ id: string; managed: boolean; editable: boolean }> = {}): Role {
  return { id: "2", guild: { id: "1" }, managed: false, editable: true, permissions: new PermissionsBitField(droits), ...autres } as unknown as Role;
}

test("un rôle sans droit de gestion peut être donné à chaque arrivée", () => {
  assert.equal(expliquerRefusRole(faireRole(0n)), null);
  assert.equal(expliquerRefusRole(faireRole(PermissionFlagsBits.SendMessages | PermissionFlagsBits.AddReactions)), null);
});

test("un rôle qui donne des droits de gestion est refusé", () => {
  assert.match(expliquerRefusRole(faireRole(PermissionFlagsBits.Administrator)) ?? "", /administrateur/);
  assert.match(expliquerRefusRole(faireRole(PermissionFlagsBits.BanMembers | PermissionFlagsBits.ManageRoles)) ?? "", /bannir/);
});

test("@everyone, un rôle de bot et un rôle hors de portée sont refusés", () => {
  assert.ok(expliquerRefusRole(faireRole(0n, { id: "1" })));
  assert.ok(expliquerRefusRole(faireRole(0n, { managed: true })));
  assert.ok(expliquerRefusRole(faireRole(0n, { editable: false })));
});
