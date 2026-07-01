'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { ENTITY_CONFIG, type EntityTable } from '../_entities/config';

function buildRecord(table: EntityTable, formData: FormData): Record<string, unknown> {
  const cfg = ENTITY_CONFIG[table];
  const rec: Record<string, unknown> = {};
  for (const f of cfg.fields) {
    switch (f.kind) {
      case 'localized':
        rec[f.key] = { en: String(formData.get(`${f.key}_en`) ?? ''), id: String(formData.get(`${f.key}_id`) ?? '') };
        break;
      case 'bool':
        rec[f.key] = formData.get(f.key) === 'on';
        break;
      case 'number': {
        const v = formData.get(f.key);
        rec[f.key] = v === null || v === '' ? null : Number(v);
        break;
      }
      case 'tags': {
        const v = String(formData.get(f.key) ?? '').trim();
        rec[f.key] = v ? v.split(',').map((s) => s.trim()).filter(Boolean) : [];
        break;
      }
      case 'date': {
        const v = String(formData.get(f.key) ?? '');
        rec[f.key] = v ? new Date(v).toISOString() : null;
        break;
      }
      default: {
        const v = String(formData.get(f.key) ?? '');
        rec[f.key] = v === '' ? null : v;
      }
    }
  }
  return rec;
}

export async function createEntity(table: EntityTable, formData: FormData) {
  const supabase = await createClient();
  const record = buildRecord(table, formData);
  const { error } = await supabase.from(table).insert(record as never);
  if (error) return { error: error.message };
  revalidatePath(`/admin/${table}`);
  revalidatePath('/', 'layout'); // entity-bound public blocks
  return { ok: true };
}

export async function updateEntity(table: EntityTable, id: string, formData: FormData) {
  const supabase = await createClient();
  const record = buildRecord(table, formData);
  const { error } = await supabase.from(table).update(record as never).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath(`/admin/${table}`);
  revalidatePath('/', 'layout');
  return { ok: true };
}

/** Archive (is_active=false) or restore (is_active=true) a row without deleting it. */
export async function setEntityActive(table: EntityTable, id: string, active: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from(table).update({ is_active: active } as never).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath(`/admin/${table}`);
  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function deleteEntity(table: EntityTable, id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath(`/admin/${table}`);
  revalidatePath('/', 'layout');
  return { ok: true };
}
