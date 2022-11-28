import { createForm, Form } from '@formily/core'
import { Schema } from './schema'
import { ISchema, SchemaKey } from './types'

function recursiveField(
  form: Form,
  schema: ISchema,
  basePath?: string,
  name?: SchemaKey
) {
  const fieldSchema = new Schema(schema)
  const fieldProps = fieldSchema.toFieldProps()

  function recursiveProperties(propBasePath?: string) {
    fieldSchema.mapProperties((propSchema, propName) => {
      recursiveField(form, propSchema, propBasePath, propName)
    })
  }

  if (name === undefined || name === null) {
    recursiveProperties(basePath)
    return
  }

  if (schema.type === 'object') {
    const field = form.createObjectField({
      ...fieldProps,
      name,
      basePath,
    })

    recursiveProperties(field.address.toString())
  } else if (schema.type === 'array') {
    const field = form.createArrayField({
      ...fieldProps,
      name,
      basePath,
    })

    const fieldAddress = field.address.toString()
    const fieldValues = form.getValuesIn(fieldAddress)
    fieldValues.forEach((value: any, index: number) => {
      if (schema.items) {
        const itemsSchema = Array.isArray(schema.items)
          ? schema.items[index] || schema.items[0]
          : schema.items

        recursiveField(form, itemsSchema as ISchema, fieldAddress, index)
      }
    })
  } else if (schema.type === 'void') {
    const field = form.createVoidField({
      ...fieldProps,
      name,
      basePath,
    })

    recursiveProperties(field.address.toString())
  } else {
    form.createField({
      ...fieldProps,
      name,
      basePath,
    })
  }
}

export const validateOnServer = (schema: ISchema, values: unknown) => {
  const form = createForm({
    values,
  })
  recursiveField(form, schema)
  return form.validate()
}
