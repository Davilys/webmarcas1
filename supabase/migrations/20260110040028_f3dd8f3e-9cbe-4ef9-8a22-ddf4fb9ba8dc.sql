-- Insert new configuration entries for expanded settings
INSERT INTO system_settings (key, value) VALUES
  ('appearance', '{"theme": "system", "primaryColor": "#0066CC", "accentColor": "#00D4FF", "customCss": "", "portalLogo": null}')
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value) VALUES
  ('contracts', '{"linkValidityDays": 7, "requireSignature": true, "blockchainVerification": true, "defaultTemplateId": null, "requiredFields": ["cpf", "email", "phone"]}')
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value) VALUES
  ('processes', '{"stages": ["analise", "enviado", "exigencia", "publicado", "registrado"], "stageColors": {"analise": "#FFA500", "enviado": "#3B82F6", "exigencia": "#EF4444", "publicado": "#8B5CF6", "registrado": "#10B981"}, "autoTransitions": []}')
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value) VALUES
  ('financial', '{"currency": "BRL", "inpiFee": 355, "defaultHonorarios": 1500, "defaultDueDays": 7, "cashDiscount": 5, "maxInstallments": 12}')
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value) VALUES
  ('inpi', '{"autoSync": true, "syncFrequency": "daily", "alertDaysBefore": 15, "alertEmails": [], "monitoredClasses": [], "webhookUrl": null}')
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value) VALUES
  ('backup', '{"lastExport": null, "autoBackup": false, "backupFrequency": "weekly", "retentionDays": 30}')
ON CONFLICT (key) DO NOTHING;