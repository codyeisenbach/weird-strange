export type PrintifyWebhookEvent = {
  id: string;
  type: string;
  created_at: string;
  resource: {
    id: string;
    type: string;
    data?: {
      shop_id?: number;
      [key: string]: unknown;
    };
  };
};

export type PrintifyImage = {
  src: string;
  variant_ids: number[];
  position: string;
  is_default: boolean;
};

export type PrintifyVariant = {
  id: number;
  sku: string;
  cost: number;
  price: number;
  title: string;
  grams: number;
  is_enabled: boolean;
  is_default: boolean;
  is_available: boolean;
  options: number[];
};

export type PrintifyOptionValue = {
  id: number;
  title: string;
};

export type PrintifyOption = {
  name: string;
  type: string;
  values: PrintifyOptionValue[];
};

export type PrintifyProduct = {
  id: string;
  title: string;
  description: string | null;
  tags: string[];
  visible: boolean;
  blueprint_id: number;
  print_provider_id: number;
  user_id: number;
  shop_id: number;
  variants: PrintifyVariant[];
  images: PrintifyImage[];
  options: PrintifyOption[];
  created_at: string;
  updated_at: string;
};
