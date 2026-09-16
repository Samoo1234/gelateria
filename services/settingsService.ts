import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type Setting = Database['public']['Tables']['settings']['Row'];
type SettingUpdate = Database['public']['Tables']['settings']['Update'];

// Get all settings as key-value object
export async function getSettings() {
    const { data, error } = await supabase
        .from('settings')
        .select('*')
        .order('key');

    if (error) throw error;

    // Convert array to object for easier access
    const settingsObj: Record<string, any> = {};
    data?.forEach(setting => {
        let value = setting.value;

        // Parse value based on data type
        if (setting.data_type === 'number') {
            value = parseFloat(value || '0');
        } else if (setting.data_type === 'boolean') {
            value = value === 'true';
        } else if (setting.data_type === 'json') {
            try {
                value = JSON.parse(value || '{}');
            } catch {
                value = {};
            }
        }

        settingsObj[setting.key] = value;
    });

    return settingsObj;
}

// Get single setting by key
export async function getSetting(key: string) {
    const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', key)
        .single();

    if (error) throw error;

    let value = data.value;

    // Parse value based on data type
    if (data.data_type === 'number') {
        value = parseFloat(value || '0');
    } else if (data.data_type === 'boolean') {
        value = value === 'true';
    } else if (data.data_type === 'json') {
        try {
            value = JSON.parse(value || '{}');
        } catch {
            value = {};
        }
    }

    return value;
}

// Update setting
export async function updateSetting(key: string, value: any) {
    let stringValue = value;

    // Convert value to string based on type
    if (typeof value === 'object') {
        stringValue = JSON.stringify(value);
    } else {
        stringValue = String(value);
    }

    const { data, error } = await supabase
        .from('settings')
        .update({ value: stringValue })
        .eq('key', key)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Update multiple settings
export async function updateSettings(settings: Record<string, any>) {
    const updates = Object.entries(settings).map(([key, value]) => {
        let stringValue = value;
        if (typeof value === 'object') {
            stringValue = JSON.stringify(value);
        } else {
            stringValue = String(value);
        }

        return supabase
            .from('settings')
            .update({ value: stringValue })
            .eq('key', key);
    });

    const results = await Promise.all(updates);

    // Check for errors
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
        throw errors[0].error;
    }

    return true;
}
