import { ISettings, Settings } from '../models/Settings.js';

export async function getShopSettings(): Promise<ISettings> {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
  return settings;
}

export async function updateShopSettings(data: Partial<ISettings>): Promise<ISettings> {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = new Settings(data);
  } else {
    Object.assign(settings, data);
  }
  await settings.save();
  return settings;
}
