-- FASE 2.1: Row Level Security (RLS) Policies
-- Aplicar restricciones de acceso a nivel de base de datos
-- Fecha: 14 May 2026

-- ============================================
-- 1. ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_campaigns ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. ACCOUNTS TABLE POLICIES
-- ============================================

-- Usuarios ven solo sus propias cuentas
CREATE POLICY "Users can view own accounts"
  ON accounts
  FOR SELECT
  USING (auth.uid() = assigned_to OR is_public = true);

-- Solo admin o propietario puede insertar
CREATE POLICY "Users can create accounts"
  ON accounts
  FOR INSERT
  WITH CHECK (auth.uid() = assigned_to);

-- Solo propietario puede actualizar
CREATE POLICY "Users can update own accounts"
  ON accounts
  FOR UPDATE
  USING (auth.uid() = assigned_to);

-- ============================================
-- 3. LEADS TABLE POLICIES
-- ============================================

-- Usuarios ven leads de sus cuentas
CREATE POLICY "Users can view leads from own accounts"
  ON leads
  FOR SELECT
  USING (
    account_id IN (
      SELECT id FROM accounts WHERE auth.uid() = assigned_to
    )
  );

-- Solo propietario de cuenta puede insertar leads
CREATE POLICY "Users can create leads in own accounts"
  ON leads
  FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT id FROM accounts WHERE auth.uid() = assigned_to
    )
  );

-- Solo propietario de cuenta puede actualizar leads
CREATE POLICY "Users can update leads in own accounts"
  ON leads
  FOR UPDATE
  USING (
    account_id IN (
      SELECT id FROM accounts WHERE auth.uid() = assigned_to
    )
  );

-- ============================================
-- 4. CONTACTS TABLE POLICIES
-- ============================================

-- Usuarios ven contactos de sus cuentas
CREATE POLICY "Users can view contacts from own accounts"
  ON contacts
  FOR SELECT
  USING (
    account_id IN (
      SELECT id FROM accounts WHERE auth.uid() = assigned_to
    )
  );

-- Crear contactos en cuentas propias
CREATE POLICY "Users can create contacts in own accounts"
  ON contacts
  FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT id FROM accounts WHERE auth.uid() = assigned_to
    )
  );

-- Actualizar contactos propios
CREATE POLICY "Users can update contacts in own accounts"
  ON contacts
  FOR UPDATE
  USING (
    account_id IN (
      SELECT id FROM accounts WHERE auth.uid() = assigned_to
    )
  );

-- ============================================
-- 5. OPPORTUNITIES TABLE POLICIES
-- ============================================

-- Usuarios ven oportunidades de sus cuentas
CREATE POLICY "Users can view opportunities from own accounts"
  ON opportunities
  FOR SELECT
  USING (
    account_id IN (
      SELECT id FROM accounts WHERE auth.uid() = assigned_to
    )
  );

-- Crear oportunidades en cuentas propias
CREATE POLICY "Users can create opportunities in own accounts"
  ON opportunities
  FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT id FROM accounts WHERE auth.uid() = assigned_to
    )
  );

-- Actualizar oportunidades propias
CREATE POLICY "Users can update opportunities in own accounts"
  ON opportunities
  FOR UPDATE
  USING (
    account_id IN (
      SELECT id FROM accounts WHERE auth.uid() = assigned_to
    )
  );

-- ============================================
-- 6. TASKS TABLE POLICIES
-- ============================================

-- Usuarios ven tareas asignadas a ellos O tareas de sus cuentas
CREATE POLICY "Users can view assigned tasks"
  ON tasks
  FOR SELECT
  USING (
    auth.uid() = assigned_to
    OR
    account_id IN (
      SELECT id FROM accounts WHERE auth.uid() = assigned_to
    )
  );

-- Crear tareas en cuentas propias
CREATE POLICY "Users can create tasks in own accounts"
  ON tasks
  FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT id FROM accounts WHERE auth.uid() = assigned_to
    )
  );

-- Actualizar tareas asignadas o de cuentas propias
CREATE POLICY "Users can update own tasks"
  ON tasks
  FOR UPDATE
  USING (
    auth.uid() = assigned_to
    OR
    account_id IN (
      SELECT id FROM accounts WHERE auth.uid() = assigned_to
    )
  );

-- ============================================
-- 7. OUTREACH_CAMPAIGNS TABLE POLICIES
-- ============================================

-- Usuarios ven campañas de sus cuentas
CREATE POLICY "Users can view campaigns from own accounts"
  ON outreach_campaigns
  FOR SELECT
  USING (
    account_id IN (
      SELECT id FROM accounts WHERE auth.uid() = assigned_to
    )
  );

-- Crear campañas en cuentas propias
CREATE POLICY "Users can create campaigns in own accounts"
  ON outreach_campaigns
  FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT id FROM accounts WHERE auth.uid() = assigned_to
    )
  );

-- Actualizar campañas de cuentas propias
CREATE POLICY "Users can update campaigns in own accounts"
  ON outreach_campaigns
  FOR UPDATE
  USING (
    account_id IN (
      SELECT id FROM accounts WHERE auth.uid() = assigned_to
    )
  );

-- ============================================
-- GRANTS: Asegurar permisos correctos
-- ============================================

-- Los usuarios anon pueden leer pero respetan RLS
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT INSERT, UPDATE ON accounts, leads, contacts, opportunities, tasks, outreach_campaigns TO anon;
