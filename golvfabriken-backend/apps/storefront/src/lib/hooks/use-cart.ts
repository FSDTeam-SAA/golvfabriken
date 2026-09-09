import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { HttpTypes } from "@medusajs/types"
import { queryKeys } from "@/lib/utils/query-keys"
import { sdk } from "@/lib/utils/sdk"
import {
  getStoredCart,
  setStoredCart,
  removeStoredCart,
  addItemOptimistically,
  createOptimisticCartItem,
  getCurrentCart,
  rollbackOptimisticCart,
  updateLineItemOptimistically,
  removeLineItemOptimistically,
  createOptimisticCart,
} from "@/lib/utils/cart"

const DEFAULT_CART_FIELDS = "+items.total, +items.metadata, +items.product.metadata, +items.variant.metadata, *shipping_methods"

export const useCart = ({ fields }: { fields?: string } = {}) => {
  return useQuery({
    queryKey: queryKeys.cart.current(fields),
    queryFn: async () => {
      const id = getStoredCart()
      if (!id) return null
      try {
        const { cart } = await sdk.store.cart.retrieve(id, {
          fields: fields || DEFAULT_CART_FIELDS,
        })
        return cart
      } catch (err) {
        console.warn("Stored cart could not be retrieved, clearing stale cart ID...", err)
        removeStoredCart()
        return null
      }
    },
    staleTime: 0
  })
}

export const useUpdateCart = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      fields = DEFAULT_CART_FIELDS,
      ...updates
    }: HttpTypes.StoreUpdateCart & { fields?: string }) => {
      const cartId = getStoredCart()
      if (!cartId) throw new Error("No cart found")
      const { cart } = await sdk.store.cart.update(cartId, updates, { fields })
      return cart
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: queryKeys.cart.predicate })
    }
  })
}

export const useCreateCart = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      region_id,
      fields = DEFAULT_CART_FIELDS,
    }: {
      region_id: string;
      fields?: string;
    }) => {
      const { cart } = await sdk.store.cart.create({ region_id }, { fields })
      setStoredCart(cart.id)
      return cart
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: queryKeys.cart.predicate })
    },
  })
}

export const useAddToCart = ({ fields }: { fields?: string } = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (variables: {
      variant_id: string;
      quantity: number;
      country_code: string;
      fields?: string;
      metadata?: Record<string, unknown>;
      product?: HttpTypes.StoreProduct;
      variant?: HttpTypes.StoreProductVariant;
      region?: HttpTypes.StoreRegion;
    }) => {
      const { variant_id, quantity, country_code, metadata, fields: requestFields } = variables
      if (!variant_id) throw new Error("Missing variant ID when adding to cart")

      let cartId = getStoredCart()

      const createFreshCart = async () => {
        let regionId = variables.region?.id
        if (!regionId) {
          const { regions } = await sdk.store.region.list({})
          const region = regions.find(r =>
            r.countries?.some(c => c.iso_2 === country_code.toLowerCase())
          ) || regions[0]
          if (!region) throw new Error(`Region not found for country code: ${country_code}`)
          regionId = region.id
        }
        const { cart } = await sdk.store.cart.create({ region_id: regionId }, {
          fields: requestFields || fields || DEFAULT_CART_FIELDS,
        })
        setStoredCart(cart.id)
        return cart.id
      }

      if (!cartId) {
        cartId = await createFreshCart()
      }

      try {
        const response = await sdk.store.cart.createLineItem(
          cartId,
          { variant_id, quantity, metadata },
          { fields: requestFields || fields || DEFAULT_CART_FIELDS }
        )
        return response.cart
      } catch (err: any) {
        const errorMessage = (err?.message || "").toLowerCase()
        const isCartNotFound =
          err?.status === 404 ||
          (errorMessage.includes("cart") && (
            errorMessage.includes("not found") ||
            errorMessage.includes("does not exist") ||
            errorMessage.includes("completed")
          ))

        if (isCartNotFound) {
          console.warn("Cart expired or not found, recreating cart...", err)
          removeStoredCart()
          const newCartId = await createFreshCart()
          const retryResponse = await sdk.store.cart.createLineItem(
            newCartId,
            { variant_id, quantity, metadata },
            { fields: requestFields || fields || DEFAULT_CART_FIELDS }
          )
          return retryResponse.cart
        }

        throw err
      }
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ predicate: queryKeys.cart.predicate })
      let previousCart = getCurrentCart(queryClient, fields)
      let didCartExist = true

      if (!previousCart && variables.region) {
        previousCart = createOptimisticCart(variables.region)
        didCartExist = false
      }

      if (previousCart && variables.product && variables.variant) {
        const optimisticItem = createOptimisticCartItem(
          variables.variant,
          variables.product,
          variables.quantity,
          variables.metadata
        )
        addItemOptimistically(queryClient, optimisticItem, previousCart, fields)
      }

      return { previousCart: didCartExist ? previousCart : undefined }
    },
    onError: (err, variables, context) => {
      if (context?.previousCart) {
        rollbackOptimisticCart(queryClient, context.previousCart, fields)
      }
    },
    onSettled: (data) => {
      queryClient.invalidateQueries({
        predicate: (query) => queryKeys.cart.predicate(query, fields && data ? [fields] : undefined)
      })
      if (data) {
        queryClient.setQueryData(queryKeys.cart.current(fields), data)
      }
    },
  })
}

export const useUpdateLineItem = ({ fields }: { fields?: string } = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (variables: { line_id: string; quantity: number }) => {
      const cartId = getStoredCart()
      if (!cartId) throw new Error("No cart found")
      const { cart } = await sdk.store.cart.updateLineItem(
        cartId,
        variables.line_id,
        { quantity: variables.quantity },
        { fields: fields || DEFAULT_CART_FIELDS }
      )
      return cart
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        predicate: (query) => queryKeys.cart.predicate(query, fields ? [fields] : undefined)
      })
      const previousCart = getCurrentCart(queryClient, fields)
      if (previousCart) {
        updateLineItemOptimistically(queryClient, variables.line_id, variables.quantity, fields)
      }
      return { previousCart }
    },
    onError: (err, variables, context) => {
      if (context?.previousCart) {
        rollbackOptimisticCart(queryClient, context.previousCart, fields)
      }
    },
    onSettled: (data) => {
      queryClient.invalidateQueries({
        predicate: (query) => queryKeys.cart.predicate(query, fields && data ? [fields] : undefined)
      })
      if (data) {
        queryClient.setQueryData(queryKeys.cart.current(fields), data)
      }
    },
  })
}

export const useDeleteLineItem = ({ fields }: { fields?: string } = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (variables: { line_id: string }) => {
      const cartId = getStoredCart()
      if (!cartId) throw new Error("No cart found")
      await sdk.store.cart.deleteLineItem(cartId, variables.line_id)
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        predicate: (query) => queryKeys.cart.predicate(query, fields ? [fields] : undefined)
      })
      const previousCart = getCurrentCart(queryClient, fields)
      if (previousCart) {
        removeLineItemOptimistically(queryClient, variables.line_id, fields)
      }
      return { previousCart }
    },
    onError: (err, variables, context) => {
      if (context?.previousCart) {
        rollbackOptimisticCart(queryClient, context.previousCart, fields)
      }
    },
    onSettled: (data) => {
      queryClient.invalidateQueries({
        predicate: (query) => queryKeys.cart.predicate(query, fields && data ? [fields] : undefined)
      })
      if (data) {
        queryClient.setQueryData(queryKeys.cart.current(fields), data)
      }
    },
  })
}

export const useApplyPromoCode = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ code }: { code: string }) => {
      const cartId = getStoredCart()
      if (!cartId) throw new Error("No cart found")
      const { cart } = await sdk.client.fetch<{ cart: HttpTypes.StoreCart }>(
        `/store/carts/${cartId}/promotions`,
        {
          method: "POST",
          body: { promo_codes: [code] },
        }
      )
      return cart
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: queryKeys.cart.predicate })
    },
  })
}

export const useRemovePromoCode = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ code }: { code: string }) => {
      const cartId = getStoredCart()
      if (!cartId) throw new Error("No cart found")
      const { cart } = await sdk.client.fetch<{ cart: HttpTypes.StoreCart }>(
        `/store/carts/${cartId}/promotions`,
        {
          method: "DELETE",
          body: { promo_codes: [code] },
        }
      )
      return cart
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: queryKeys.cart.predicate })
    },
  })
}
