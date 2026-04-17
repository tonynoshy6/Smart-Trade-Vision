import { pgTable, text, serial, real, jsonb, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const analysesTable = pgTable("analyses", {
  id: serial("id").primaryKey(),
  analysisSchool: text("analysis_school").notNull().default("combined"), // 'smc' | 'ict' | 'sk' | 'mersal' | 'combined'
  tradeStyle: text("trade_style").default("flex"), // 'scalp' | 'swing' | 'flex'
  tradeType: text("trade_type").notNull(), // 'buy' | 'sell'
  orderType: text("order_type").default("market"), // 'market' | 'buy_limit' | 'sell_limit' | 'buy_stop' | 'sell_stop'
  session: text("session").default("any"), // 'asian' | 'london' | 'new_york' | 'london_new_york' | 'any'
  probabilityWarning: text("probability_warning"),
  entryPoint: real("entry_point").notNull(),
  entryZoneHigh: real("entry_zone_high"),
  entryZoneLow: real("entry_zone_low"),
  stopLoss: real("stop_loss").notNull(),
  takeProfit: real("take_profit").notNull(),
  takeProfit2: real("take_profit_2"),
  takeProfit3: real("take_profit_3"),
  takeProfitReasons: jsonb("take_profit_reasons").default({}), // { tp1: string, tp2: string, tp3: string }
  successProbability: real("success_probability").notNull(),
  tradeConfidence: integer("trade_confidence").default(3), // 1-5 stars: قوة الإعداد التقني
  riskRewardRatio: real("risk_reward_ratio").notNull(),
  detailedAnalysis: text("detailed_analysis").notNull(),
  trendAnalysis: text("trend_analysis"),
  schoolReasons: jsonb("school_reasons").default({}),
  institutionalSignals: jsonb("institutional_signals").notNull().default([]),
  liquidityZones: jsonb("liquidity_zones").notNull(),
  orderBlocks: jsonb("order_blocks").notNull(),
  fairValueGaps: jsonb("fair_value_gaps").notNull(),
  structureBreaks: jsonb("structure_breaks").notNull(),
  characterChanges: jsonb("character_changes").notNull(),
  classicalPatterns: jsonb("classical_patterns").notNull().default([]),
  supportResistanceLevels: jsonb("support_resistance_levels").notNull().default([]),
  market: text("market").notNull(),
  timeframe: text("timeframe").notNull(),
  symbol: text("symbol"),
  imageBase64: text("image_base64"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAnalysisSchema = createInsertSchema(analysesTable).omit({ id: true, createdAt: true });
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analysesTable.$inferSelect;
