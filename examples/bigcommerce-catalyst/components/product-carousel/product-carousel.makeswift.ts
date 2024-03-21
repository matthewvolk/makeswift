import dynamic from 'next/dynamic';

import { Combobox, TextInput } from '@makeswift/runtime/controls';
import { forwardNextDynamicRef } from '@makeswift/runtime/next';

import { runtime } from '~/lib/makeswift/runtime';

type Category = {
  entityId: number;
  name: string;
  path: string;
}

const fetchCategories = async (): Promise<Category[]> => {
  const response = await fetch('/api/categories')

  const { categories }: { categories: Category[] } = await response.json()

  return categories
}

export const props = {
  title: TextInput({ label: 'Title', defaultValue: 'Products', selectAll: true }),
  categoryId: Combobox({
    label: "Category",
    async getOptions(query) {
      const categories = await fetchCategories();

      return categories
        .map((category) => {
          return {
            id: category.entityId.toString(),
            label: category.name,
            value: category.entityId,
          }
        })
        .filter((option) =>
          option.label.toLowerCase().includes(query.toLowerCase())
        )
    },
  }),
};

runtime.registerComponent(
  forwardNextDynamicRef((patch) =>
    dynamic(() => patch(import('./product-carousel').then(({ ProductCardCarousel }) => ProductCardCarousel))),
  ),
  { type: 'ProductCarousel', label: 'Product Carousel', icon: 'carousel', props },
);
