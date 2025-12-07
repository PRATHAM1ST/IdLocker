/**
 * Category Card component with gradient background
 * Squircle design language
 * Supports both preset and custom categories
 */

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
	Dimensions,
	StyleProp,
	StyleSheet,
	TouchableOpacity,
	View,
	ViewStyle,
} from "react-native";
import { useTheme } from "../context/ThemeProvider";
import {
	borderRadius,
	getCategoryColor,
	shadows,
	spacing,
} from "../styles/theme";
import { ITEM_TYPE_CONFIGS } from "../utils/constants";
import type { CustomCategory, VaultItemType } from "../utils/types";
import { ThemedText } from "./ThemedText";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - spacing.base * 2 - spacing.md) / 2;
const CARD_HEIGHT = 110;
const ENHANCED_CARD_WIDTH = (SCREEN_WIDTH - spacing.base * 2 - spacing.md) / 2;

interface CategoryCardProps {
	type: VaultItemType;
	count: number;
	onPress: () => void;
}

export function CategoryCard({ type, count, onPress }: CategoryCardProps) {
	const { isDark } = useTheme();
	const config = ITEM_TYPE_CONFIGS[type];
	const categoryColor = getCategoryColor(type, isDark);

	return (
		<TouchableOpacity
			style={[styles.container, shadows.md]}
			onPress={onPress}
			activeOpacity={0.85}
		>
			<LinearGradient
				colors={[
					categoryColor.gradientStart,
					categoryColor.gradientEnd,
				]}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
				style={styles.gradient}
			>
				{/* Icon */}
				<View style={styles.iconContainer}>
					<Ionicons
						name={config.icon as any}
						size={24}
						color="rgba(255, 255, 255, 0.9)"
					/>
				</View>

				{/* Label */}
				<View style={styles.labelContainer}>
					<ThemedText variant="label" style={styles.label}>
						{config.label}
					</ThemedText>
					{count > 0 && (
						<View style={styles.countBadge}>
							<ThemedText
								variant="caption"
								style={styles.countText}
							>
								{count}
							</ThemedText>
						</View>
					)}
				</View>
			</LinearGradient>
		</TouchableOpacity>
	);
}

/**
 * Large category card for grid view
 */
interface CategoryCardLargeProps extends CategoryCardProps {
	subtitle?: string;
}

export function CategoryCardLarge({
	type,
	count,
	onPress,
}: CategoryCardLargeProps) {
	const { isDark } = useTheme();
	const config = ITEM_TYPE_CONFIGS[type];
	const categoryColor = getCategoryColor(type, isDark);

	return (
		<TouchableOpacity
			style={[styles.largeContainer, shadows.md]}
			onPress={onPress}
			activeOpacity={0.85}
		>
			<LinearGradient
				colors={[
					categoryColor.gradientStart,
					categoryColor.gradientEnd,
				]}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
				style={styles.largeGradient}
			>
				{/* Icon */}
				<View style={styles.largeIconContainer}>
					<Ionicons
						name={config.icon as any}
						size={32}
						color="rgba(255, 255, 255, 0.95)"
					/>
				</View>

				{/* Content */}
				<View style={styles.largeContent}>
					<ThemedText variant="subtitle" style={styles.largeLabel}>
						{config.label}
					</ThemedText>
					<ThemedText variant="caption" style={styles.largeSubtitle}>
						{count} {count === 1 ? "item" : "items"}
					</ThemedText>
				</View>
			</LinearGradient>
		</TouchableOpacity>
	);
}

/**
 * Dynamic category card that works with CustomCategory
 * Enhanced with edit/delete buttons and additional info
 */
interface DynamicCategoryCardProps {
	category: CustomCategory;
	count: number;
	onPress: () => void;
	onEdit?: () => void;
	onDelete?: () => void;
	showActions?: boolean;
	customStyle?: StyleProp<ViewStyle>;
}

export function DynamicCategoryCard({
	category,
	count,
	onPress,
	onEdit,
	onDelete,
	showActions = false,
	customStyle,
}: DynamicCategoryCardProps) {
	return (
		<View style={[styles.enhancedCardContainer, shadows.md, customStyle]}>
			<TouchableOpacity
				style={{ flex: 1 }}
				onPress={onPress}
				activeOpacity={0.85}
			>
				<LinearGradient
					colors={[
						category.color.gradientStart,
						category.color.gradientEnd,
					]}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 1 }}
					style={styles.enhancedGradient}
				>
					{/* Top section with icon and actions */}
					<View style={styles.enhancedTopSection}>
						<View style={styles.enhancedIconContainer}>
							<Ionicons
								name={category.icon as any}
								size={28}
								color="rgba(255, 255, 255, 0.95)"
							/>
						</View>

						{/* Action buttons overlay */}
						{showActions && (onEdit || onDelete) && (
							<View style={styles.enhancedActionOverlay}>
								{onEdit && (
									<TouchableOpacity
										style={[
											styles.enhancedActionBtn,
											{
												backgroundColor:
													"rgba(255, 255, 255, 0.25)",
											},
										]}
										onPress={(e) => {
											e.stopPropagation();
											onEdit();
										}}
										activeOpacity={0.7}
									>
										<Ionicons
											name="pencil"
											size={14}
											color="#FFFFFF"
										/>
									</TouchableOpacity>
								)}
								{onDelete && (
									<TouchableOpacity
										style={[
											styles.enhancedActionBtn,
											{
												backgroundColor:
													"rgba(255, 255, 255, 0.25)",
											},
										]}
										onPress={(e) => {
											e.stopPropagation();
											onDelete();
										}}
										activeOpacity={0.7}
									>
										<Ionicons
											name="trash-outline"
											size={14}
											color="#FFFFFF"
										/>
									</TouchableOpacity>
								)}
							</View>
						)}
					</View>

					{/* Content section */}
					<View style={styles.enhancedContentSection}>
						<View style={styles.enhancedTitleRow}>
							<ThemedText
								variant="subtitle"
								style={styles.enhancedLabel}
								numberOfLines={1}
							>
								{category.label}
							</ThemedText>
						</View>

						{/* Stats row */}
						<View style={styles.enhancedStatsRow}>
							<View style={styles.enhancedStatItem}>
								<Ionicons
									name="cube-outline"
									size={12}
									color="rgba(255, 255, 255, 0.8)"
								/>
								<ThemedText
									variant="caption"
									style={styles.enhancedStatText}
								>
									{count}
								</ThemedText>
							</View>
							<View style={styles.enhancedStatItem}>
								<Ionicons
									name="list-outline"
									size={12}
									color="rgba(255, 255, 255, 0.8)"
								/>
								<ThemedText
									variant="caption"
									style={styles.enhancedStatText}
								>
									{category.fields.length}
								</ThemedText>
							</View>
						</View>
					</View>
				</LinearGradient>
			</TouchableOpacity>
		</View>
	);
}

/**
 * Category filter card - looks like CategoryCard but works as a selectable filter
 */
interface CategoryFilterCardProps {
	type: VaultItemType | "all";
	label: string;
	icon: string;
	isSelected: boolean;
	count?: number;
	onPress: () => void;
}

const FILTER_CARD_WIDTH = 90;
const FILTER_CARD_HEIGHT = 72;

export function CategoryFilterCard({
	type,
	label,
	icon,
	isSelected,
	count,
	onPress,
}: CategoryFilterCardProps) {
	const { colors, isDark } = useTheme();

	const categoryColor =
		type !== "all" ? getCategoryColor(type, isDark) : null;

	// For 'all' type, use accent color
	const gradientColors: [string, string] =
		type !== "all" && categoryColor
			? [categoryColor.gradientStart, categoryColor.gradientEnd]
			: [colors.accent, colors.accentLight];

	return (
		<TouchableOpacity
			style={[
				styles.filterCard,
				isSelected && shadows.md,
				!isSelected && { opacity: 0.6 },
			]}
			onPress={onPress}
			activeOpacity={0.8}
		>
			<LinearGradient
				colors={gradientColors}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
				style={styles.filterGradient}
			>
				{/* Icon */}
				<View style={styles.filterIconContainer}>
					<Ionicons
						name={icon as any}
						size={16}
						color="rgba(255, 255, 255, 0.9)"
					/>
				</View>

				{/* Label and count */}
				<View style={styles.filterLabelContainer}>
					<ThemedText
						variant="caption"
						style={styles.filterLabel}
						numberOfLines={1}
					>
						{label}
					</ThemedText>
					{count !== undefined && (
						<ThemedText
							variant="caption"
							style={styles.filterCount}
						>
							{count}
						</ThemedText>
					)}
				</View>

				{/* Selection indicator */}
				{isSelected && (
					<View style={styles.selectedIndicator}>
						<Ionicons
							name="checkmark-circle"
							size={12}
							color="#FFFFFF"
						/>
					</View>
				)}
			</LinearGradient>
		</TouchableOpacity>
	);
}

/**
 * Dynamic category filter card that works with CustomCategory
 */
interface DynamicCategoryFilterCardProps {
	category: CustomCategory | null; // null for 'all'
	isSelected: boolean;
	count: number;
	onPress: () => void;
}

export function DynamicCategoryFilterCard({
	category,
	isSelected,
	count,
	onPress,
}: DynamicCategoryFilterCardProps) {
	const { colors } = useTheme();

	// For 'all' type (null category), use accent color
	const gradientColors: [string, string] = category
		? [category.color.gradientStart, category.color.gradientEnd]
		: [colors.accent, colors.accentLight];

	const icon = category ? category.icon : "grid-outline";
	const label = category ? category.label : "All";

	return (
		<TouchableOpacity
			style={[
				styles.filterCard,
				isSelected && shadows.md,
				!isSelected && { opacity: 0.6 },
				{ transform: [{ scale: isSelected ? 1.05 : 1 }] },
			]}
			onPress={onPress}
			activeOpacity={0.8}
		>
			<LinearGradient
				colors={gradientColors}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
				style={styles.filterGradient}
			>
				{/* Icon */}
				<View style={styles.filterIconContainer}>
					<Ionicons
						name={icon as any}
						size={16}
						color="rgba(255, 255, 255, 0.9)"
					/>
				</View>

				{/* Label and count */}
				<View style={styles.filterLabelContainer}>
					<ThemedText
						variant="caption"
						style={styles.filterLabel}
						numberOfLines={1}
					>
						{label}
					</ThemedText>
					<ThemedText variant="caption" style={styles.filterCount}>
						{count}
					</ThemedText>
				</View>

				{/* Selection indicator */}
				{isSelected && (
					<View style={styles.selectedIndicator}>
						<Ionicons
							name="checkmark-circle"
							size={12}
							color="#FFFFFF"
						/>
					</View>
				)}
			</LinearGradient>
		</TouchableOpacity>
	);
}

/**
 * Minimal category chip for filter/selection (legacy)
 */
interface CategoryChipProps {
	type: VaultItemType | "all";
	label: string;
	icon: string;
	isSelected: boolean;
	count?: number;
	onPress: () => void;
}

export function CategoryChip({
	type,
	label,
	icon,
	isSelected,
	count,
	onPress,
}: CategoryChipProps) {
	const { colors, isDark } = useTheme();

	const categoryColor =
		type !== "all" ? getCategoryColor(type, isDark) : null;

	return (
		<TouchableOpacity
			style={[
				styles.chip,
				{
					backgroundColor: isSelected
						? categoryColor?.gradientStart || colors.accent
						: colors.backgroundTertiary,
					transform: [{ scale: isSelected ? 1.05 : 1 }],
				},
			]}
			onPress={onPress}
			activeOpacity={0.7}
		>
			<Ionicons
				name={icon as any}
				size={16}
				color={isSelected ? "#FFFFFF" : colors.textSecondary}
			/>
			<ThemedText
				variant="caption"
				style={[
					styles.chipLabel,
					{ color: isSelected ? "#FFFFFF" : colors.textSecondary },
				]}
			>
				{label}
			</ThemedText>
			{count !== undefined && count > 0 && (
				<View
					style={[
						styles.chipBadge,
						{
							backgroundColor: isSelected
								? "rgba(255,255,255,0.3)"
								: colors.border,
						},
					]}
				>
					<ThemedText
						variant="caption"
						style={{
							color: isSelected
								? "#FFFFFF"
								: colors.textSecondary,
							fontSize: 10,
						}}
					>
						{count}
					</ThemedText>
				</View>
			)}
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	container: {
		width: CARD_WIDTH,
		height: CARD_HEIGHT,
		borderRadius: borderRadius.lg,
		overflow: "hidden",
		marginRight: spacing.md,
	},
	gradient: {
		flex: 1,
		padding: spacing.base,
		justifyContent: "space-between",
	},
	iconContainer: {
		width: 44,
		height: 44,
		borderRadius: borderRadius.md,
		backgroundColor: "rgba(255, 255, 255, 0.2)",
		alignItems: "center",
		justifyContent: "center",
	},
	labelContainer: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	label: {
		color: "#FFFFFF",
		fontWeight: "600",
	},
	countBadge: {
		backgroundColor: "rgba(255, 255, 255, 0.25)",
		paddingHorizontal: spacing.sm,
		paddingVertical: 2,
		borderRadius: borderRadius.sm,
	},
	countText: {
		color: "#FFFFFF",
		fontSize: 11,
		fontWeight: "600",
	},
	// Large card styles
	largeContainer: {
		width: "48%",
		borderRadius: borderRadius.lg,
		overflow: "hidden",
		marginBottom: spacing.md,
	},
	largeGradient: {
		minHeight: 140,
		padding: spacing.base,
		justifyContent: "space-between",
	},
	largeIconContainer: {
		width: 56,
		height: 56,
		borderRadius: borderRadius.md,
		backgroundColor: "rgba(255, 255, 255, 0.2)",
		alignItems: "center",
		justifyContent: "center",
	},
	largeContent: {
		// Bottom aligned via space-between
	},
	largeContentHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.xs,
		marginBottom: spacing.xs,
	},
	largeLabel: {
		color: "#FFFFFF",
		fontWeight: "700",
		flex: 1,
	},
	largeSubtitle: {
		color: "rgba(255, 255, 255, 0.8)",
		marginBottom: 2,
	},
	largeFieldCount: {
		color: "rgba(255, 255, 255, 0.7)",
		fontSize: 11,
	},
	categoryActions: {
		flexDirection: "row",
		padding: spacing.sm,
		gap: spacing.xs,
		borderBottomLeftRadius: borderRadius.lg,
		borderBottomRightRadius: borderRadius.lg,
	},
	actionButton: {
		flex: 1,
		height: 32,
		borderRadius: borderRadius.sm,
		alignItems: "center",
		justifyContent: "center",
	},
	// Enhanced card styles
	enhancedCardContainer: {
		width: ENHANCED_CARD_WIDTH,
		borderRadius: borderRadius.xl,
		overflow: "hidden",
	},
	enhancedGradient: {
		minHeight: 160,
		padding: spacing.md,
		justifyContent: "space-between",
	},
	enhancedTopSection: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		marginBottom: spacing.md,
	},
	enhancedIconContainer: {
		width: 52,
		height: 52,
		borderRadius: borderRadius.md,
		backgroundColor: "rgba(255, 255, 255, 0.2)",
		alignItems: "center",
		justifyContent: "center",
	},
	enhancedActionOverlay: {
		flexDirection: "row",
		gap: spacing.xs,
	},
	enhancedActionBtn: {
		width: 28,
		height: 28,
		borderRadius: borderRadius.sm,
		alignItems: "center",
		justifyContent: "center",
		backdropFilter: "blur(10px)",
	},
	enhancedContentSection: {
		flex: 1,
		justifyContent: "flex-end",
	},
	enhancedTitleRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.xs,
		marginBottom: spacing.sm,
	},
	enhancedLabel: {
		color: "#FFFFFF",
		fontWeight: "700",
		fontSize: 16,
		flex: 1,
	},
	enhancedPresetBadge: {
		backgroundColor: "rgba(255, 255, 255, 0.3)",
		paddingHorizontal: spacing.xs + 2,
		paddingVertical: 3,
		borderRadius: borderRadius.sm,
	},
	enhancedPresetText: {
		color: "#FFFFFF",
		fontSize: 9,
		fontWeight: "700",
		letterSpacing: 0.5,
	},
	enhancedStatsRow: {
		flexDirection: "row",
		gap: spacing.md,
		alignItems: "center",
	},
	enhancedStatItem: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
	},
	enhancedStatText: {
		color: "rgba(255, 255, 255, 0.9)",
		fontSize: 12,
		fontWeight: "600",
	},
	// Filter card styles (like CategoryCard but smaller, for filters)
	filterCard: {
		width: FILTER_CARD_WIDTH,
		height: FILTER_CARD_HEIGHT,
		borderRadius: borderRadius.sm,
		overflow: "hidden",
		marginRight: spacing.sm,
	},
	filterGradient: {
		flex: 1,
		padding: spacing.sm,
		justifyContent: "space-between",
	},
	filterIconContainer: {
		width: 28,
		height: 28,
		borderRadius: 6,
		backgroundColor: "rgba(255, 255, 255, 0.2)",
		alignItems: "center",
		justifyContent: "center",
	},
	filterLabelContainer: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	filterLabel: {
		color: "#FFFFFF",
		fontWeight: "600",
		fontSize: 11,
		flex: 1,
	},
	filterCount: {
		color: "rgba(255, 255, 255, 0.8)",
		fontSize: 10,
		fontWeight: "600",
	},
	selectedIndicator: {
		position: "absolute",
		top: 4,
		right: 4,
	},
	// Chip styles
	chip: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.xs,
		borderRadius: borderRadius.sm,
		marginRight: spacing.sm,
	},
	chipLabel: {
		marginLeft: spacing.xs,
		fontWeight: "500",
	},
	chipBadge: {
		marginLeft: spacing.xs,
		paddingHorizontal: spacing.xs,
		paddingVertical: 2,
		borderRadius: borderRadius.sm,
		minWidth: 18,
		alignItems: "center",
	},
});
