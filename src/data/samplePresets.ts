import { SamplePreset } from '../types/drift';

export const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: 'customer-amount-drift',
    name: 'Customer & Amount Drift (Default)',
    badge: 'Prompt Scenario',
    description: 'Nesting of customer_id into customer.id and unit/type shift in amount (cents integer vs dollar float string).',
    oldPayload: JSON.stringify(
      {
        customer_id: 'cus_123',
        amount: 2500,
      },
      null,
      2
    ),
    newPayload: JSON.stringify(
      {
        customer: {
          id: 'cus_123',
        },
        amount: '25.00',
      },
      null,
      2
    ),
    highlightNotes: 'Requires explicit unit conversion rule: 2500 cents vs "25.00" dollars cannot be assumed equal automatically without developer specification.',
  },
  {
    id: 'webhook-envelope-v2',
    name: 'Payment Webhook v1 to v2 Envelope',
    badge: 'Stripe / Shopify Style',
    description: 'Flat event notification restructured into enveloped data object with snake_case to camelCase renames.',
    oldPayload: JSON.stringify(
      {
        event_type: 'invoice.payment_succeeded',
        invoice_id: 'in_778102',
        subtotal: 4900,
        currency: 'usd',
        paid: true,
        customer_email: 'sarah@example.com',
      },
      null,
      2
    ),
    newPayload: JSON.stringify(
      {
        event: 'invoice.payment_succeeded',
        data: {
          invoice: {
            id: 'in_778102',
            subtotal_amount: '49.00',
            currency: 'USD',
          },
          status: 'paid',
        },
        contact: {
          email: 'sarah@example.com',
        },
        webhook_version: '2026-10-01',
      },
      null,
      2
    ),
    highlightNotes: 'Major envelope restructuring: invoice_id moved into data.invoice.id, boolean paid changed to status string, and new webhook_version added.',
  },
  {
    id: 'user-profile-metadata',
    name: 'User Identity & Permissions Schema',
    badge: 'Auth & SaaS',
    description: 'Flat role strings shifted to nested objects, and list attributes migrated to delimiter strings.',
    oldPayload: JSON.stringify(
      {
        userId: 'usr_882',
        role: 'admin',
        permissions: ['read', 'write', 'delete'],
        is_verified: 1,
      },
      null,
      2
    ),
    newPayload: JSON.stringify(
      {
        user: {
          id: 'usr_882',
          role_info: {
            name: 'admin',
            level: 10,
          },
        },
        permissions: 'read,write,delete',
        is_verified: true,
        last_login_at: '2026-10-21T02:30:00Z',
      },
      null,
      2
    ),
    highlightNotes: 'Integer 1 changed to boolean true, array permissions transformed into comma-delimited string, userId nested under user.id.',
  },
];
