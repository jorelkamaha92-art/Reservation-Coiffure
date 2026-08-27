-- ==============================================================================
-- SEED DATA : CINDY MALORIE COIFFURE (Pavia & Lombardie, Italie)
-- Données fictives complètes pour démonstration & tests
-- ==============================================================================

-- 1. SERVICES (8 Prestations complètes)
INSERT INTO public.services (id, name, description, duration_minutes, price, category, is_active) VALUES
('srv-braid-1', 'Stitch braid with cross', 'Tresses stitch haute précision avec motif géométrique en croix sur le dessus. Tracés nets et finitions soignées.', 150, 50.00, 'Tresses & Braids', true),
('srv-braid-2', 'Stitch braids', 'Tresses stitch droites et soignées avec séparations nettes et contours impeccables. Confort et tenue longue durée.', 105, 60.00, 'Tresses & Braids', true),
('srv-braid-3', 'Knotless braids', 'Longues tresses sans nœuds fluides et ultra-légères. Mèches rouge vif dégradées, aucune traction sur le cuir chevelu.', 195, 95.00, 'Tresses & Braids', true),
('srv-braid-4', 'Cornrows', 'Tresses plaquées traditionnelles régulières avec finitions attachées en chignons élégants à l’arrière de la tête.', 90, 45.00, 'Tresses & Braids', true),
('srv-5', 'Coupe Femme & Brushing', 'Diagnostic personnalisé, shampoing traitant, coupe sur-mesure et brushing éclat haute tenue.', 60, 45.00, 'Femme', true),
('srv-6', 'Coupe Homme & Soin Barbe', 'Coupe aux ciseaux et tondeuse, finitions rasoir, taille de barbe et serviette chaude.', 45, 30.00, 'Homme', true),
('srv-7', 'Balayage Signature & Patine', 'Éclaircissement naturel sur-mesure avec patine neutralisante et masque reconstructeur.', 120, 95.00, 'Technique', true),
('srv-8', 'Soin Botox Capillaire & Massage', 'Soin reconstructeur profond à la kératine et acide hyaluronique pour un effet miroir.', 60, 55.00, 'Soin', true)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  duration_minutes = EXCLUDED.duration_minutes,
  price = EXCLUDED.price,
  category = EXCLUDED.category;

-- 2. STAFF (Cindy Malorie)
INSERT INTO public.staff (id, full_name, specialty, bio, avatar_url, is_active) VALUES
('staff-cindy', 'Cindy Malorie', 'Spécialiste Braids, Tresses Artistiques & Soins Capillaires', 'Artisan coiffeuse styliste à Pavia (Via Francana 10) et à domicile en Lombardie. Plus de 100K abonnés sur TikTok (@cindymalorie).', '/images/hairstyles/stitch-braid-cross.png', true)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  specialty = EXCLUDED.specialty,
  bio = EXCLUDED.bio,
  avatar_url = EXCLUDED.avatar_url;

-- 3. PROFILES / CLIENTS FICTIFS
INSERT INTO public.profiles (id, full_name, email, phone, role, address, loyalty_points, preferences) VALUES
('00000000-0000-0000-0000-000000000001', 'Matteo Gambino', 'matteo.gambino@gmail.com', '+39 340 1234567', 'client', 'Via Roma 12, Pavia (Italie)', 120, '{"favorite_cut": "Stitch braid with cross", "hair_type": "Crépu / Frisé 4C", "admin_notes": "Client très ponctuel. Préfère les finitions tondeuse sans alcool."}'),
('00000000-0000-0000-0000-000000000002', 'Chiara Bellini', 'chiara.bellini@yahoo.it', '+39 349 7654321', 'client', 'Corso Garibaldi 45, Pavia (Italie)', 285, '{"favorite_cut": "Knotless braids", "favorite_color": "Mèches Rouge Vif", "hair_type": "Bouclé 3B", "admin_notes": "Cliente fidèle VIP. Adore les coiffures protectrices longues."}'),
('00000000-0000-0000-0000-000000000003', 'Lorenzo Rossi', 'lorenzo.rossi@outlook.it', '+39 338 9876543', 'client', 'Via Milano 8, Pavia (Italie)', 90, '{"favorite_cut": "Cornrows", "hair_type": "Frisé 4A", "admin_notes": "Demande souvent des créneaux en début de matinée."}'),
('00000000-0000-0000-0000-000000000004', 'Sofia Conti', 'sofia.conti@gmail.com', '+39 333 4567890', 'client', 'Via Torino 22, Milano (Italie)', 0, '{"favorite_cut": "Balayage Signature & Patine", "favorite_color": "Miel Doré", "hair_type": "Ondulé 2C", "admin_notes": "A découvert Cindy sur TikTok (@cindymalorie). Première prise de contact."}'),
('00000000-0000-0000-0000-000000000005', 'Alessandro Ferrari', 'a.ferrari@libero.it', '+39 320 8765432', 'client', 'Viale Libertà 15, Pavia (Italie)', 30, '{"favorite_cut": "Coupe Homme & Soin Barbe", "hair_type": "Lisse", "admin_notes": "Dernier RDV il y a 3 mois."}'),
('00000000-0000-0000-0000-000000000006', 'Elena Moretti', 'elena.moretti@gmail.com', '+39 347 1122334', 'client', 'Via Francana 8, Pavia (Italie)', 350, '{"favorite_cut": "Soin Botox Capillaire & Massage", "hair_type": "Coloré / Sensibilisé", "admin_notes": "Voisine du studio au 10 Via Francana. Cliente très régulière."}')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address,
  loyalty_points = EXCLUDED.loyalty_points,
  preferences = EXCLUDED.preferences;

-- 4. RÉCOMPENSES DU PROGRAMME DE FIDÉLITÉ
INSERT INTO public.rewards (id, name, description, points_required, is_active) VALUES
('rew-1', 'Soin hydratant express offert', 'Un soin réparateur express aux huiles végétales offert lors de votre prochain rendez-vous.', 50, true),
('rew-2', 'Remise immédiate de 10 €', 'Bénéficiez de 10 € de déduction sur la prestation ou le modèle de tresse de votre choix.', 100, true),
('rew-3', 'Shampoing traitant & Brushing Offert', 'Un rituel de lavage et brushing éclat offert en studio ou à domicile.', 150, true),
('rew-4', 'Prestation complète offerte', 'Votre coupe, coiffure tressée ou soin botox entièrement offert.', 250, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  points_required = EXCLUDED.points_required;

-- 5. HORAIRES D'OUVERTURE RECURRENTS
INSERT INTO public.availability_settings (day_of_week, start_time, end_time, is_active) VALUES
(1, '09:00:00', '19:00:00', true), -- Lundi
(2, '09:00:00', '19:00:00', true), -- Mardi
(3, '09:00:00', '19:00:00', true), -- Mercredi
(4, '09:00:00', '19:00:00', true), -- Jeudi
(5, '09:00:00', '19:00:00', true), -- Vendredi
(6, '09:00:00', '18:00:00', true), -- Samedi
(0, '10:00:00', '14:00:00', false) -- Dimanche (Fermé par défaut)
ON CONFLICT (day_of_week) DO UPDATE SET
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  is_active = EXCLUDED.is_active;

-- 6. DATES BLOQUÉES / CONGÉS
INSERT INTO public.blocked_dates (id, blocked_date, reason, is_half_day) VALUES
('blk-1', CURRENT_DATE + INTERVAL '14 days', 'Formation Masterclass Braids & Tresses Artistiques', false),
('blk-2', CURRENT_DATE + INTERVAL '21 days', 'Jour férié (Festa Nazionale)', false)
ON CONFLICT (id) DO NOTHING;

-- 7. RENDEZ-VOUS DÉMONSTRATION
INSERT INTO public.appointments (id, client_id, service_id, staff_id, appointment_date, start_time, end_time, status, location_type, location_address, notes, total_price, reminder_sent) VALUES
('app-demo-1', '00000000-0000-0000-0000-000000000001', 'srv-braid-1', 'staff-cindy', CURRENT_DATE, '10:00:00', '12:30:00', 'confirmed', 'salon', 'Via Francana 10, Pavia (Italie)', 'Motif croix bien centré sur le dessus de la tête.', 50.00, true),
('app-demo-2', '00000000-0000-0000-0000-000000000002', 'srv-braid-3', 'staff-cindy', CURRENT_DATE + INTERVAL '1 day', '14:00:00', '17:15:00', 'confirmed', 'home', 'Corso Garibaldi 45, Pavia (Italie)', 'Apporter mèches rouges dégradées supplémentaires.', 95.00, false),
('app-demo-3', '00000000-0000-0000-0000-000000000003', 'srv-braid-4', 'staff-cindy', CURRENT_DATE + INTERVAL '3 days', '09:30:00', '11:00:00', 'pending', 'salon', 'Via Francana 10, Pavia (Italie)', 'Réservation en ligne à valider.', 45.00, false),
('app-demo-4', '00000000-0000-0000-0000-000000000004', 'srv-7', 'staff-cindy', CURRENT_DATE + INTERVAL '5 days', '15:00:00', '17:00:00', 'pending', 'home', 'Via Torino 22, Milano (Italie)', 'Déplacement à Milan. Diagnostic balayage préalable sur photo.', 95.00, false),
('app-demo-5', '00000000-0000-0000-0000-000000000006', 'srv-8', 'staff-cindy', CURRENT_DATE - INTERVAL '1 day', '11:00:00', '12:00:00', 'completed', 'salon', 'Via Francana 10, Pavia (Italie)', 'Soin botox réussi. Cheveux ultra brillants.', 55.00, true),
('app-demo-6', '00000000-0000-0000-0000-000000000001', 'srv-braid-2', 'staff-cindy', CURRENT_DATE - INTERVAL '7 days', '16:00:00', '17:45:00', 'completed', 'salon', 'Via Francana 10, Pavia (Italie)', 'Stitch braids régulières.', 60.00, true)
ON CONFLICT (id) DO NOTHING;

-- 8. TRANSACTIONS DE FIDÉLITÉ DÉMONSTRATION
INSERT INTO public.loyalty_transactions (id, client_id, amount, type, description) VALUES
('tx-demo-1', '00000000-0000-0000-0000-000000000002', 95, 'earn', 'Points gagnés : Knotless braids (95 €)'),
('tx-demo-2', '00000000-0000-0000-0000-000000000006', 55, 'earn', 'Points gagnés : Soin Botox Capillaire & Massage (55 €)'),
('tx-demo-3', '00000000-0000-0000-0000-000000000001', 60, 'earn', 'Points gagnés : Stitch braids (60 €)'),
('tx-demo-4', '00000000-0000-0000-0000-000000000002', -100, 'redeem', 'Récompense échangée : Remise immédiate de 10 €'),
('tx-demo-5', '00000000-0000-0000-0000-000000000006', 50, 'bonus', 'Bonus de fidélité VIP : Parrainage cliente satisfaite')
ON CONFLICT (id) DO NOTHING;
