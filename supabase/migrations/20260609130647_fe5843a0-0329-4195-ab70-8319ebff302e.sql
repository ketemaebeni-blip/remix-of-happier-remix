CREATE TABLE public.shop_item_availability (
  item_id text PRIMARY KEY,
  available boolean NOT NULL DEFAULT true,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid
);

GRANT SELECT ON public.shop_item_availability TO anon;
GRANT SELECT ON public.shop_item_availability TO authenticated;
GRANT ALL ON public.shop_item_availability TO service_role;

ALTER TABLE public.shop_item_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view shop item availability"
  ON public.shop_item_availability FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert shop item availability"
  ON public.shop_item_availability FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update shop item availability"
  ON public.shop_item_availability FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete shop item availability"
  ON public.shop_item_availability FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_shop_item_availability_updated_at
  BEFORE UPDATE ON public.shop_item_availability
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed existing items as available
INSERT INTO public.shop_item_availability (item_id, available) VALUES
  ('fast1', true),('fast2', true),('fast3', true),('fast4', true),
  ('ker1', true),('ker2', true),('ker3', true),('ker4', true),
  ('ysh1', true),('ysh2', true),('ysh3', true),('ysh4', true),
  ('grad1', true),('grad2', true),('grad3', true),('grad4', true),
  ('wed1', true),('wed2', true),('wed3', true),('wed4', true),
  ('bday1', true),('bday2', true),('bday3', true),('bday4', true),
  ('avail1', true),('avail2', true),('avail3', true),('avail4', true),('avail5', true),('avail6', true)
ON CONFLICT (item_id) DO NOTHING;

ALTER PUBLICATION supabase_realtime ADD TABLE public.shop_item_availability;