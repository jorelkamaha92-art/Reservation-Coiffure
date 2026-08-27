-- ==============================================================================
-- MIGRATION 04 : DONNÉES INITIALES (Prestations, Coiffeuse, Récompenses, Horaires)
-- ==============================================================================

-- 1. Services
INSERT INTO public.services (id, name, description, duration_minutes, price, category, is_active) VALUES
('a0000000-0000-0000-0000-000000000001', 'Stitch braid with cross', 'Tresses stitch haute précision avec motif géométrique en croix sur le dessus. Tracés nets et finitions soignées.', 150, 50.00, 'Tresses & Braids', true),
('a0000000-0000-0000-0000-000000000002', 'Stitch braids', 'Tresses stitch droites et soignées avec séparations nettes et contours impeccables. Confort et tenue longue durée.', 105, 60.00, 'Tresses & Braids', true),
('a0000000-0000-0000-0000-000000000003', 'Knotless braids', 'Longues tresses sans nœuds fluides et ultra-légères. Mèches rouge vif dégradées, aucune traction sur le cuir chevelu.', 195, 95.00, 'Tresses & Braids', true),
('a0000000-0000-0000-0000-000000000004', 'Cornrows', 'Tresses plaquées traditionnelles régulières avec finitions attachées en chignons élégants à l’arrière de la tête.', 90, 45.00, 'Tresses & Braids', true),
('a0000000-0000-0000-0000-000000000005', 'Coupe Femme & Brushing', 'Diagnostic personnalisé, shampoing traitant, coupe sur-mesure et brushing éclat haute tenue.', 60, 45.00, 'Femme', true),
('a0000000-0000-0000-0000-000000000006', 'Coupe Homme & Soin Barbe', 'Coupe aux ciseaux et tondeuse, finitions rasoir, taille de barbe et serviette chaude.', 45, 30.00, 'Homme', true),
('a0000000-0000-0000-0000-000000000007', 'Balayage Signature & Patine', 'Éclaircissement naturel sur-mesure avec patine neutralisante et masque reconstructeur.', 120, 95.00, 'Technique', true),
('a0000000-0000-0000-0000-000000000008', 'Soin Botox Capillaire & Massage', 'Soin reconstructeur profond à la kératine et acide hyaluronique pour un effet miroir.', 60, 55.00, 'Soin', true)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  duration_minutes = EXCLUDED.duration_minutes,
  price = EXCLUDED.price,
  category = EXCLUDED.category;

-- 2. Staff (Cindy Malorie)
INSERT INTO public.staff (id, full_name, specialty, bio, avatar_url, is_active) VALUES
('b0000000-0000-0000-0000-000000000001', 'Cindy Malorie', 'Spécialiste Braids, Tresses Artistiques & Soins Capillaires', 'Artisan coiffeuse styliste à Pavia (Via Francana 10) et à domicile en Lombardie. Plus de 100K abonnés sur TikTok (@cindymalorie).', '/images/hairstyles/stitch-braid-cross.png', true)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  specialty = EXCLUDED.specialty,
  bio = EXCLUDED.bio,
  avatar_url = EXCLUDED.avatar_url;

-- 3. Récompenses de fidélité
INSERT INTO public.rewards (id, name, description, points_required, is_active) VALUES
('c0000000-0000-0000-0000-000000000001', 'Soin hydratant express offert', 'Un soin réparateur express aux huiles végétales offert lors de votre prochain rendez-vous.', 50, true),
('c0000000-0000-0000-0000-000000000002', 'Remise immédiate de 10 €', 'Bénéficiez de 10 € de déduction sur la prestation ou le modèle de tresse de votre choix.', 100, true),
('c0000000-0000-0000-0000-000000000003', 'Shampoing traitant & Brushing Offert', 'Un rituel de lavage et brushing éclat offert en studio ou à domicile.', 150, true),
('c0000000-0000-0000-0000-000000000004', 'Prestation complète offerte', 'Votre coupe, coiffure tressée ou soin botox entièrement offert.', 250, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  points_required = EXCLUDED.points_required;

-- 4. Horaires réguliers
INSERT INTO public.availability_settings (day_of_week, start_time, end_time, is_active) VALUES
(1, '09:00:00', '19:00:00', true),
(2, '09:00:00', '19:00:00', true),
(3, '09:00:00', '19:00:00', true),
(4, '09:00:00', '19:00:00', true),
(5, '09:00:00', '19:00:00', true),
(6, '09:00:00', '18:00:00', true),
(0, '10:00:00', '14:00:00', false);

-- 5. Dates bloquées
INSERT INTO public.blocked_dates (id, date, reason, is_full_day) VALUES
('d0000000-0000-0000-0000-000000000001', CURRENT_DATE + INTERVAL '14 days', 'Formation Masterclass Braids & Tresses Artistiques', true),
('d0000000-0000-0000-0000-000000000002', CURRENT_DATE + INTERVAL '21 days', 'Jour férié (Festa Nazionale)', true)
ON CONFLICT (id) DO NOTHING;
