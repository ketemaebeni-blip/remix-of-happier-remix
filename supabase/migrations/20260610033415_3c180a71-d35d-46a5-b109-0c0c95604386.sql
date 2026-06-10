
CREATE TABLE public.shop_items (
  id text PRIMARY KEY,
  name text NOT NULL,
  sub text NOT NULL DEFAULT '',
  cat text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  img text NOT NULL DEFAULT '',
  available boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.shop_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_items TO authenticated;
GRANT ALL ON public.shop_items TO service_role;

ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view shop items"
  ON public.shop_items FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert shop items"
  ON public.shop_items FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update shop items"
  ON public.shop_items FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete shop items"
  ON public.shop_items FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_shop_items_updated_at
  BEFORE UPDATE ON public.shop_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.shop_items;

INSERT INTO public.shop_items (id, name, sub, cat, price, img, sort_order) VALUES
('fast1','Fruit & Nut Fasting Cake','Mixed dried fruits · Walnuts · Spiced batter · No dairy','Fasting',35,'https://images.pexels.com/photos/37661106/pexels-photo-37661106.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400',10),
('fast2','Vegan Chocolate','Rich cocoa · Coconut milk · Dairy-free ganache','Fasting',38,'https://images.pexels.com/photos/37262561/pexels-photo-37262561.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400',20),
('fast3','Apple Cinnamon','Fresh apples · Cinnamon spice · Oat crumble topping','Fasting',32,'https://images.pexels.com/photos/30739085/pexels-photo-30739085.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400',30),
('fast4','Carrot Walnut','Grated carrots · Walnuts · Orange zest · Plant-based cream','Fasting',34,'https://images.pexels.com/photos/32397279/pexels-photo-32397279.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400',40),
('ker1','Baptism Cross Cake','White vanilla · Gold cross · Soft buttercream','Kerestena',45,'https://images.pexels.com/photos/2144200/pexels-photo-2144200.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400',10),
('ker2','Holy Communion Cake','Elegant white · Host detail · Floral accents','Kerestena',55,'https://images.pexels.com/photos/32437628/pexels-photo-32437628.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400',20),
('ker3','Easter Resurrection Cake','Chocolate layers · Spring florals · Symbolic design','Kerestena',48,'https://images.pexels.com/photos/31336127/pexels-photo-31336127.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400',30),
('ker4','Confirmation Blessing','Light sponge · Pastel frosting · Dove decoration','Kerestena',42,'https://images.pexels.com/photos/15307373/pexels-photo-15307373.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400',40),
('ysh1','Traditional Shemgelena','Honey bread base · Decorative icing · Cultural motifs','Yeshemgelena',40,'https://images.pexels.com/photos/29051739/pexels-photo-29051739.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400',10),
('ysh2','Blue Baby Welcome','Vanilla sponge · Blue buttercream · Teddy topper','Yeshemgelena',38,'https://images.pexels.com/photos/30233124/pexels-photo-30233124.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400',20),
('ysh3','Pink Baby Shower','Strawberry cream · Pink roses · Edible pearls','Yeshemgelena',38,'https://images.pexels.com/photos/12742498/pexels-photo-12742498.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400',30),
('ysh4','Neutral Woodland','Earthy tones · Forest animals · Gender-neutral design','Yeshemgelena',42,'https://images.pexels.com/photos/30233124/pexels-photo-30233124.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400',40),
('grad1','Cap & Gown Tier','2-tier chocolate · Graduation cap topper · Gold details','Graduation',65,'https://images.pexels.com/photos/9540405/pexels-photo-9540405.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400',10),
('grad2','Diploma Scroll','Vanilla roll design · Edible ribbon · Personalised name','Graduation',50,'https://images.pexels.com/photos/20768168/pexels-photo-20768168.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400',20),
('grad3','Class of 2026','Modern design · School colours · Year banner','Graduation',58,'https://images.pexels.com/photos/12419449/pexels-photo-12419449.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400',30),
('grad4','Scholar Book Stack','Stacked book design · Fondant finish · Quote plaque','Graduation',55,'https://images.pexels.com/photos/6210746/pexels-photo-6210746.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400',40),
('wed1','3-Tier Floral Wedding','Vanilla sponge · Buttercream roses · Fresh greenery','Wedding',220,'https://images.pexels.com/photos/34569681/pexels-photo-34569681.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400',10),
('wed2','Anniversary Gold','Golden fondant · Champagne accents · Sugar flowers','Wedding',95,'https://images.pexels.com/photos/34073612/pexels-photo-34073612.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400',20),
('wed3','Silver Jubilee','Silver leaf details · White tiers · 25th anniversary','Wedding',150,'https://images.pexels.com/photos/17869890/pexels-photo-17869890.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400',30),
('wed4','Classic Ivory Wedding','Single tier · Ivory fondant · Gold leaf details','Wedding',120,'https://images.pexels.com/photos/28378968/pexels-photo-28378968.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400',40),
('bday1','Chocolate Celebration','Dark chocolate sponge · Ganache drip · Strawberry topping','Birthday',38,'https://images.pexels.com/photos/2337821/pexels-photo-2337821.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400',10),
('bday2','Vanilla Party Cake','Classic vanilla · Rainbow sprinkles · Buttercream','Birthday',32,'https://images.pexels.com/photos/32916204/pexels-photo-32916204.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400',20),
('bday3','Red Velvet Party','Red velvet layers · Cream cheese · Festive decor','Birthday',42,'https://images.pexels.com/photos/9553739/pexels-photo-9553739.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400',30),
('bday4','Custom Theme Cake','Your design · Any theme · Personalised message','Birthday',55,'https://images.pexels.com/photos/5713248/pexels-photo-5713248.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400',40),
('avail1','Classic Vanilla Slice','Freshly baked this morning · Light sponge · Buttercream','Available Today',6,'https://images.pexels.com/photos/1055272/pexels-photo-1055272.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400',10),
('avail2','Chocolate Fudge Cupcake','Rich cocoa · Ganache topping · Sprinkles','Available Today',4.5,'https://images.pexels.com/photos/3776947/pexels-photo-3776947.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400',20),
('avail3','Strawberry Tart','Fresh strawberries · Custard · Flaky pastry','Available Today',7,'https://images.pexels.com/photos/140831/pexels-photo-140831.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400',30),
('avail4','Lemon Drizzle Loaf','Zesty lemon · Sugar glaze · Moist sponge','Available Today',5.5,'https://images.pexels.com/photos/1485806/pexels-photo-1485806.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400',40),
('avail5','Red Velvet Cookie','Cream cheese chunks · Cocoa · Soft bake','Available Today',3.5,'https://images.pexels.com/photos/2067396/pexels-photo-2067396.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400',50),
('avail6','Cinnamon Roll','Warm spice · Cream cheese glaze · Yeast dough','Available Today',5,'https://images.pexels.com/photos/351961/pexels-photo-351961.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400',60);
