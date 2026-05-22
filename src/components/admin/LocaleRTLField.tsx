'use client'

import React from 'react'
import { CheckboxField, useFormFields } from '@payloadcms/ui'

import { ClientOnlyAdminField } from '@/components/admin/ClientOnlyAdminField'

type LocaleRTLFieldProps = React.ComponentProps<typeof CheckboxField>

/**
 * RTL checkbox — read-only when a preset is selected; editable for "Other (custom)" only.
 */
export function LocaleRTLField(props: LocaleRTLFieldProps) {
  return (
    <ClientOnlyAdminField>
      <LocaleRTLFieldContent {...props} />
    </ClientOnlyAdminField>
  )
}

function LocaleRTLFieldContent(props: LocaleRTLFieldProps) {
  const preset = useFormFields(([fields]) => fields.preset?.value as string | undefined)
  const isCustom = preset === 'custom'

  return (
    <CheckboxField
      {...props}
      field={{
        ...props.field,
        admin: {
          ...props.field.admin,
          readOnly: !isCustom,
        },
      }}
    />
  )
}
