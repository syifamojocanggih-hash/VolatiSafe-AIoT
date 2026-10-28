"""Initial schema with TimescaleDB hypertables

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-10-25 22:30:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Enable TimescaleDB Extension if on PostgreSQL
    bind = op.get_bind()
    if bind.dialect.name == 'postgresql':
        op.execute("CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;")

    # 2. Table: fields
    op.create_table(
        'fields',
        sa.Column('field_id', sa.String(length=32), primary_key=True),
        sa.Column('name', sa.String(length=128), nullable=False),
        sa.Column('owner_name', sa.String(length=128), nullable=False),
        sa.Column('owner_phone', sa.String(length=32), nullable=False),
        sa.Column('village', sa.String(length=64), nullable=False),
        sa.Column('latitude', sa.Numeric(precision=10, scale=7), nullable=False),
        sa.Column('longitude', sa.Numeric(precision=10, scale=7), nullable=False),
        sa.Column('area_ha', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('soil_type', sa.String(length=64), server_default='clay_alkaline'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now())
    )

    # 3. Table: nodes
    op.create_table(
        'nodes',
        sa.Column('node_id', sa.String(length=32), primary_key=True),
        sa.Column('field_id', sa.String(length=32), sa.ForeignKey('fields.field_id', ondelete='SET NULL'), nullable=True),
        sa.Column('firmware_ver', sa.String(length=32), nullable=False, server_default='v1.0.2-prod'),
        sa.Column('battery_v', sa.Numeric(precision=4, scale=2), nullable=True),
        sa.Column('installed_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('last_seen', sa.DateTime(timezone=True), nullable=True)
    )

    # 4. Table: field_state
    op.create_table(
        'field_state',
        sa.Column('field_id', sa.String(length=32), sa.ForeignKey('fields.field_id'), primary_key=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('theta', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('t_soil', sa.Numeric(precision=4, scale=1), nullable=False),
        sa.Column('ph', sa.Numeric(precision=3, scale=2), nullable=False),
        sa.Column('et0_today', sa.Numeric(precision=5, scale=2), server_default='0.0'),
        sa.Column('dat', sa.Integer(), server_default='0'),
        sa.Column('last_urea_kg', sa.Numeric(precision=6, scale=2), server_default='0.0')
    )

    # 5. Table: crop_cycles
    op.create_table(
        'crop_cycles',
        sa.Column('cycle_id', sa.String(length=36), primary_key=True),
        sa.Column('field_id', sa.String(length=32), sa.ForeignKey('fields.field_id'), nullable=True),
        sa.Column('planting_date', sa.Date(), nullable=False),
        sa.Column('corn_variety', sa.String(length=64), nullable=False),
        sa.Column('target_yield_ton_ha', sa.Numeric(precision=4, scale=2), server_default='8.0'),
        sa.Column('status', sa.String(length=24), server_default='active'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now())
    )

    # 6. Table: fertilization_logs
    op.create_table(
        'fertilization_logs',
        sa.Column('log_id', sa.String(length=36), primary_key=True),
        sa.Column('field_id', sa.String(length=32), sa.ForeignKey('fields.field_id'), nullable=True),
        sa.Column('applied_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('stage_name', sa.String(length=32), nullable=False),
        sa.Column('urea_kg', sa.Numeric(precision=6, scale=2), nullable=False),
        sa.Column('npk_phonska_kg', sa.Numeric(precision=6, scale=2), nullable=False),
        sa.Column('za_kg', sa.Numeric(precision=6, scale=2), server_default='0.0'),
        sa.Column('avri_at_time', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True)
    )

    # 7. Table: telemetry (Hypertable in TimescaleDB)
    op.create_table(
        'telemetry',
        sa.Column('ts', sa.DateTime(timezone=True), nullable=False),
        sa.Column('node_id', sa.String(length=32), nullable=False),
        sa.Column('moisture', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('soil_temp', sa.Numeric(precision=4, scale=1), nullable=True),
        sa.Column('ph', sa.Numeric(precision=3, scale=2), nullable=True),
        sa.Column('battery_v', sa.Numeric(precision=4, scale=2), nullable=True),
        sa.Column('rssi_dbm', sa.Integer(), nullable=True),
        sa.Column('is_predicted', sa.Boolean(), server_default='false'),
        sa.PrimaryKeyConstraint('ts', 'node_id')
    )
    op.create_index('idx_telemetry_node_ts', 'telemetry', ['node_id', sa.text('ts DESC')])

    if bind.dialect.name == 'postgresql':
        op.execute("SELECT create_hypertable('telemetry', 'ts', chunk_time_interval => INTERVAL '7 days', if_not_exists => TRUE);")

    # 8. Table: predictions (Hypertable in TimescaleDB)
    op.create_table(
        'predictions',
        sa.Column('ts', sa.DateTime(timezone=True), nullable=False),
        sa.Column('field_id', sa.String(length=32), nullable=False),
        sa.Column('avri_score', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('risk_class', sa.String(length=16), nullable=False),
        sa.Column('shap_values', postgresql.JSONB(astext_type=sa.Text()) if bind.dialect.name == 'postgresql' else sa.JSON(), nullable=True),
        sa.Column('model_version', sa.String(length=32), nullable=False, server_default='piml-lgbm-v1.2'),
        sa.PrimaryKeyConstraint('ts', 'field_id')
    )
    op.create_index('idx_predictions_field_ts', 'predictions', ['field_id', sa.text('ts DESC')])

    if bind.dialect.name == 'postgresql':
        op.execute("SELECT create_hypertable('predictions', 'ts', chunk_time_interval => INTERVAL '14 days', if_not_exists => TRUE);")

    # 9. Table: data_provenance
    op.create_table(
        'data_provenance',
        sa.Column('dataset_id', sa.String(length=64), primary_key=True),
        sa.Column('source_name', sa.String(length=128), nullable=False),
        sa.Column('period_start', sa.Date(), nullable=False),
        sa.Column('period_end', sa.Date(), nullable=False),
        sa.Column('row_count', sa.Integer(), nullable=False),
        sa.Column('checksum_sha256', sa.String(length=64), nullable=False),
        sa.Column('ingested_at', sa.DateTime(timezone=True), server_default=sa.func.now())
    )

def downgrade() -> None:
    op.drop_table('data_provenance')
    op.drop_table('predictions')
    op.drop_table('telemetry')
    op.drop_table('fertilization_logs')
    op.drop_table('crop_cycles')
    op.drop_table('field_state')
    op.drop_table('nodes')
    op.drop_table('fields')
