
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.grant_admin_on_signup()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF lower(NEW.email) = 'owner@selamcake.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.grant_admin_on_signup() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER on_auth_user_created_grant_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.grant_admin_on_signup();

CREATE TABLE public.cake_availability (
  cake_id INTEGER PRIMARY KEY,
  available BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

GRANT SELECT (cake_id, available, updated_at) ON public.cake_availability TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.cake_availability TO authenticated;
GRANT ALL ON public.cake_availability TO service_role;

ALTER TABLE public.cake_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view cake availability"
  ON public.cake_availability FOR SELECT USING (true);
CREATE POLICY "Admins can insert cake availability"
  ON public.cake_availability FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update cake availability"
  ON public.cake_availability FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete cake availability"
  ON public.cake_availability FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.cake_availability REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cake_availability;

CREATE TABLE public.cake_overrides (
  cake_id INTEGER PRIMARY KEY,
  name TEXT,
  category TEXT,
  price NUMERIC,
  image_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

GRANT SELECT (cake_id, name, category, price, image_url, updated_at) ON public.cake_overrides TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.cake_overrides TO authenticated;
GRANT ALL ON public.cake_overrides TO service_role;

ALTER TABLE public.cake_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view cake overrides"
  ON public.cake_overrides FOR SELECT USING (true);
CREATE POLICY "Admins can insert cake overrides"
  ON public.cake_overrides FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update cake overrides"
  ON public.cake_overrides FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete cake overrides"
  ON public.cake_overrides FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.cake_overrides REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cake_overrides;

CREATE TABLE public.cake_availability_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cake_id INTEGER NOT NULL,
  available BOOLEAN NOT NULL,
  changed_by UUID,
  changed_by_email TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.cake_availability_log TO authenticated;
GRANT ALL ON public.cake_availability_log TO service_role;

ALTER TABLE public.cake_availability_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view availability log"
  ON public.cake_availability_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_cake_availability_log_changed_at ON public.cake_availability_log (changed_at DESC);
CREATE INDEX idx_cake_availability_log_cake_id ON public.cake_availability_log (cake_id);

CREATE OR REPLACE FUNCTION public.log_cake_availability_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_email TEXT;
  v_user UUID;
BEGIN
  v_user := COALESCE(NEW.updated_by, auth.uid());
  IF v_user IS NOT NULL THEN
    SELECT email INTO v_email FROM auth.users WHERE id = v_user;
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.available IS NOT DISTINCT FROM OLD.available THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.cake_availability_log (cake_id, available, changed_by, changed_by_email)
  VALUES (NEW.cake_id, NEW.available, v_user, v_email);
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.log_cake_availability_change() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER cake_availability_log_trigger
  AFTER INSERT OR UPDATE ON public.cake_availability
  FOR EACH ROW EXECUTE FUNCTION public.log_cake_availability_change();

CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name text,
  customer_phone text,
  customer_address text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'new',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view orders" ON public.orders
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update orders" ON public.orders
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete orders" ON public.orders
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Admins can upload cake images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'cake-images' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update cake images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'cake-images' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete cake images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'cake-images' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can read cake images" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'cake-images');
