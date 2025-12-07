/**
 * Add item screen - dynamic form based on item type
 * Redesigned with modern styling
 * Supports custom categories and item-level custom fields
 */

import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ExpoImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
	Alert,
	Image,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	TouchableOpacity,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AssetPicker } from "../../src/components/AssetPicker";
import { Button } from "../../src/components/Button";
import { CustomFieldEditor } from "../../src/components/CustomFieldEditor";
import { Input, Select } from "../../src/components/Input";
import { ThemedText } from "../../src/components/ThemedText";
import { ThemedView } from "../../src/components/ThemedView";
import { useAssets } from "../../src/context/AssetProvider";
import { useCategories } from "../../src/context/CategoryProvider";
import { useTheme } from "../../src/context/ThemeProvider";
import { useVault } from "../../src/context/VaultProvider";
import { formatFileSize } from "../../src/storage/assetStorage";
import { borderRadius, shadows, spacing } from "../../src/styles/theme";
import type {
	Asset,
	AssetReference,
	AssetType,
	CustomCategory,
	CustomField,
	FieldDefinition,
	VaultItemType,
} from "../../src/utils/types";
import { sanitizeInput } from "../../src/utils/validation";
import { DynamicCategoryCard } from "@/src/components";

export default function AddItemScreen() {
	const router = useRouter();
	// Route params for context-aware add screen:
	// - type/categoryId: Pre-select a category
	// - mode: 'item' (default) or 'asset' for standalone asset upload
	const params = useLocalSearchParams<{
		type?: string;
		categoryId?: string;
		mode?: string;
	}>();

	// Debug: Log received params
	console.log("[AddScreen] Params received:", {
		type: params.type,
		categoryId: params.categoryId,
		mode: params.mode,
		params
	});

	// Determine mode from params (default to 'item')
	const mode = params.mode || "item";
	// Support both 'type' and 'categoryId' params
	const initialCategoryId = params.categoryId || params.type || null;
	const insets = useSafeAreaInsets();
	const { colors } = useTheme();
	const { addItem, items } = useVault();
	const { categories, getCategoryById, deleteCategory } = useCategories();
	const { saveImageAsset, saveDocumentAsset, refreshAssets } = useAssets();

	const [selectedType, setSelectedType] = useState<VaultItemType | null>(
		null
	);
	const [label, setLabel] = useState("");
	const [fields, setFields] = useState<Record<string, string>>({});
	const [customFields, setCustomFields] = useState<CustomField[]>([]);
	const [assetRefs, setAssetRefs] = useState<AssetReference[]>([]);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [isSaving, setIsSaving] = useState(false);

	// Sync selectedType with route params when they change
	useEffect(() => {
		if (initialCategoryId && !selectedType) {
			setSelectedType(initialCategoryId as VaultItemType);
		}
	}, [initialCategoryId, selectedType]);

	// Get the selected category
	const selectedCategory = useMemo(() => {
		if (!selectedType) return null;
		return getCategoryById(selectedType) || null;
	}, [selectedType, getCategoryById]);

	const categoryColor = selectedCategory?.color || null;

	const handleTypeSelect = useCallback((category: CustomCategory) => {
		setSelectedType(category.id);
		setLabel("");
		setFields({});
		setCustomFields([]);
		setAssetRefs([]);
		setErrors({});
	}, []);

	const handleFieldChange = useCallback(
		(key: string, value: string) => {
			const sanitized = sanitizeInput(value);
			setFields((prev) => ({ ...prev, [key]: sanitized }));
			// Clear error when user starts typing
			if (errors[key]) {
				setErrors((prev) => {
					const newErrors = { ...prev };
					delete newErrors[key];
					return newErrors;
				});
			}
		},
		[errors]
	);

	const handleSave = useCallback(async () => {
		if (!selectedType || !selectedCategory) return;

		// Basic validation
		const errorMap: Record<string, string> = {};

		if (!label.trim()) {
			errorMap.label = "Label is required";
		}

		// Validate required fields from category
		for (const fieldDef of selectedCategory.fields) {
			if (fieldDef.required && !fields[fieldDef.key]?.trim()) {
				errorMap[fieldDef.key] = `${fieldDef.label} is required`;
			}
		}

		if (Object.keys(errorMap).length > 0) {
			setErrors(errorMap);
			return;
		}

		setIsSaving(true);

		// Debug: Log what we're saving
		console.log("[AddItem] Saving item with assets:", {
			type: selectedType,
			label: label.trim(),
			assetRefCount: assetRefs.length,
			customFieldCount: customFields.length,
		});

		const newItem = await addItem({
			type: selectedType,
			label: label.trim(),
			fields,
			customFields: customFields.length > 0 ? customFields : undefined,
			assetRefs: assetRefs.length > 0 ? assetRefs : undefined,
		});

		// Debug: Log the saved item
		console.log("[AddItem] Saved item:", newItem);

		setIsSaving(false);

		if (newItem) {
			// Small delay to ensure navigation is ready
			setTimeout(() => {
				router.back();
			}, 100);
		} else {
			Alert.alert("Error", "Failed to save item. Please try again.");
		}
	}, [
		selectedType,
		selectedCategory,
		label,
		fields,
		customFields,
		assetRefs,
		addItem,
		router,
	]);

	// ========== Asset Upload Mode Handlers ==========
	const [uploadedAssets, setUploadedAssets] = useState<Asset[]>([]);
	const [isUploadingAsset, setIsUploadingAsset] = useState(false);
	const [editingCategories, setEditingCategories] = useState<boolean>(false);

	const requestAssetPermissions = async (
		type: "camera" | "library"
	): Promise<boolean> => {
		if (type === "camera") {
			const { status } =
				await ExpoImagePicker.requestCameraPermissionsAsync();
			if (status !== "granted") {
				Alert.alert(
					"Camera Permission Required",
					"Please grant camera access in your device settings to capture photos."
				);
				return false;
			}
		} else {
			const { status } =
				await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
			if (status !== "granted") {
				Alert.alert(
					"Photo Library Permission Required",
					"Please grant photo library access in your device settings to select images."
				);
				return false;
			}
		}
		return true;
	};

	const handleAssetPickImage = useCallback(
		async (source: "camera" | "library") => {
			const hasPermission = await requestAssetPermissions(source);
			if (!hasPermission) return;

			setIsUploadingAsset(true);

			try {
				const options: ExpoImagePicker.ImagePickerOptions = {
					mediaTypes: ["images"],
					allowsEditing: true,
					quality: 0.8,
				};

				const result =
					source === "camera"
						? await ExpoImagePicker.launchCameraAsync(options)
						: await ExpoImagePicker.launchImageLibraryAsync(
								options
						  );

				if (!result.canceled && result.assets[0]) {
					const imageAsset = result.assets[0];
					const originalFilename =
						imageAsset.fileName || `image_${Date.now()}.jpg`;

					const savedAsset = await saveImageAsset(
						imageAsset.uri,
						originalFilename,
						imageAsset.width,
						imageAsset.height
					);

					if (savedAsset) {
						setUploadedAssets((prev) => [...prev, savedAsset]);
					} else {
						Alert.alert(
							"Error",
							"Failed to save image. Please try again."
						);
					}
				}
			} catch {
				Alert.alert("Error", "Failed to pick image. Please try again.");
			} finally {
				setIsUploadingAsset(false);
			}
		},
		[saveImageAsset]
	);

	const handleAssetPickDocument = useCallback(async () => {
		setIsUploadingAsset(true);

		try {
			const result = await DocumentPicker.getDocumentAsync({
				type: [
					"application/pdf",
					"application/msword",
					"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
					"application/vnd.ms-excel",
					"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
					"text/plain",
				],
				copyToCacheDirectory: true,
			});

			if (!result.canceled && result.assets[0]) {
				const docAsset = result.assets[0];

				const savedAsset = await saveDocumentAsset(
					docAsset.uri,
					docAsset.name,
					docAsset.mimeType || "application/octet-stream"
				);

				if (savedAsset) {
					setUploadedAssets((prev) => [...prev, savedAsset]);
				} else {
					Alert.alert(
						"Error",
						"Failed to save document. Please try again."
					);
				}
			}
		} catch {
			Alert.alert("Error", "Failed to pick document. Please try again.");
		} finally {
			setIsUploadingAsset(false);
		}
	}, [saveDocumentAsset]);

	const handleCreateCategory = useCallback(() => {
		router.push("/(vault)/category/new" as any);
	}, [router]);

	const getAssetIcon = (type: AssetType): keyof typeof Ionicons.glyphMap => {
		switch (type) {
			case "image":
				return "image-outline";
			case "pdf":
				return "document-text-outline";
			case "document":
				return "document-outline";
			default:
				return "attach-outline";
		}
	};

	const handleAssetUploadDone = useCallback(() => {
		// Refresh assets list to include newly uploaded assets
		refreshAssets();
		router.back();
	}, [refreshAssets, router]);

	const renderAssetUploader = () => (
		<View style={styles.assetUploaderContainer}>
			<View style={styles.assetUploaderHeader}>
				<View
					style={[
						styles.assetUploaderIconContainer,
						{ backgroundColor: colors.primary + "20" },
					]}
				>
					<Ionicons
						name="cloud-upload-outline"
						size={48}
						color={colors.primary}
					/>
				</View>
				<ThemedText
					variant="subtitle"
					style={styles.assetUploaderTitle}
				>
					Upload Files
				</ThemedText>
				<ThemedText
					variant="body"
					color="secondary"
					style={styles.assetUploaderSubtitle}
				>
					Add images, PDFs, or documents to your asset library
				</ThemedText>
			</View>

			{/* Upload options */}
			<View style={styles.assetUploadOptions}>
				<TouchableOpacity
					style={[
						styles.assetUploadOption,
						{
							backgroundColor: colors.card,
							borderColor: colors.border,
						},
					]}
					onPress={() => handleAssetPickImage("camera")}
					disabled={isUploadingAsset}
					activeOpacity={0.7}
				>
					<View
						style={[
							styles.assetUploadOptionIcon,
							{ backgroundColor: "#4CAF50" + "20" },
						]}
					>
						<Ionicons
							name="camera-outline"
							size={28}
							color="#4CAF50"
						/>
					</View>
					<ThemedText variant="label">Camera</ThemedText>
					<ThemedText variant="caption" color="secondary">
						Take a photo
					</ThemedText>
				</TouchableOpacity>

				<TouchableOpacity
					style={[
						styles.assetUploadOption,
						{
							backgroundColor: colors.card,
							borderColor: colors.border,
						},
					]}
					onPress={() => handleAssetPickImage("library")}
					disabled={isUploadingAsset}
					activeOpacity={0.7}
				>
					<View
						style={[
							styles.assetUploadOptionIcon,
							{ backgroundColor: "#2196F3" + "20" },
						]}
					>
						<Ionicons
							name="images-outline"
							size={28}
							color="#2196F3"
						/>
					</View>
					<ThemedText variant="label">Gallery</ThemedText>
					<ThemedText variant="caption" color="secondary">
						Choose image
					</ThemedText>
				</TouchableOpacity>

				<TouchableOpacity
					style={[
						styles.assetUploadOption,
						{
							backgroundColor: colors.card,
							borderColor: colors.border,
						},
					]}
					onPress={handleAssetPickDocument}
					disabled={isUploadingAsset}
					activeOpacity={0.7}
				>
					<View
						style={[
							styles.assetUploadOptionIcon,
							{ backgroundColor: "#FF9800" + "20" },
						]}
					>
						<Ionicons
							name="document-outline"
							size={28}
							color="#FF9800"
						/>
					</View>
					<ThemedText variant="label">Document</ThemedText>
					<ThemedText variant="caption" color="secondary">
						PDF, Word, etc.
					</ThemedText>
				</TouchableOpacity>
			</View>

			{/* Uploaded assets preview */}
			{uploadedAssets.length > 0 && (
				<View style={styles.uploadedAssetsSection}>
					<ThemedText
						variant="label"
						style={styles.uploadedAssetsTitle}
					>
						Uploaded ({uploadedAssets.length})
					</ThemedText>
					<View style={styles.uploadedAssetsList}>
						{uploadedAssets.map((asset) => (
							<View
								key={asset.id}
								style={[
									styles.uploadedAssetItem,
									{
										backgroundColor: colors.card,
										borderColor: colors.border,
									},
								]}
							>
								{asset.type === "image" ? (
									<Image
										source={{ uri: asset.uri }}
										style={styles.uploadedAssetThumbnail}
									/>
								) : (
									<View
										style={[
											styles.uploadedAssetDocIcon,
											{
												backgroundColor:
													colors.backgroundTertiary,
											},
										]}
									>
										<Ionicons
											name={getAssetIcon(asset.type)}
											size={24}
											color={colors.primary}
										/>
									</View>
								)}
								<View style={styles.uploadedAssetInfo}>
									<ThemedText
										variant="body"
										numberOfLines={1}
									>
										{asset.originalFilename}
									</ThemedText>
									<ThemedText
										variant="caption"
										color="secondary"
									>
										{formatFileSize(asset.size)} •{" "}
										{asset.type.toUpperCase()}
									</ThemedText>
								</View>
								<Ionicons
									name="checkmark-circle"
									size={24}
									color="#4CAF50"
								/>
							</View>
						))}
					</View>
				</View>
			)}

			{/* Loading indicator */}
			{isUploadingAsset && (
				<View style={styles.uploadingIndicator}>
					<Ionicons
						name="hourglass-outline"
						size={24}
						color={colors.primary}
					/>
					<ThemedText
						variant="body"
						color="secondary"
						style={{ marginLeft: spacing.sm }}
					>
						Uploading...
					</ThemedText>
				</View>
			)}

			{/* Done button */}
			{uploadedAssets.length > 0 && (
				<View style={styles.saveContainer}>
					<Button
						title="Done"
						onPress={handleAssetUploadDone}
						icon="checkmark"
						fullWidth
						size="lg"
					/>
				</View>
			)}
		</View>
	);

	const categoryCounts = useMemo(() => {
		const counts: Record<string, number> = {
			all: items.length,
		};

		// Calculate counts for each category
		for (const category of categories) {
			counts[category.id] = items.filter(
				(item) => item.type === category.id
			).length;
		}

		return counts;
	}, [items, categories]);

	const handleEditCategory = useCallback(
		(category: CustomCategory) => {
			router.push(`/(vault)/category/${category.id}` as any);
		},
		[router]
	);

	const handleDeleteCategory = useCallback(
		(category: CustomCategory) => {
			const itemCount = categoryCounts[category.id] || 0;

			if (itemCount > 0) {
				Alert.alert(
					"Cannot Delete",
					`This category has ${itemCount} item${
						itemCount === 1 ? "" : "s"
					}. Please delete or move the items first.`,
					[{ text: "OK" }]
				);
				return;
			}

			Alert.alert(
				"Delete Category",
				`Are you sure you want to delete "${category.label}"? This action cannot be undone.`,
				[
					{ text: "Cancel", style: "cancel" },
					{
						text: "Delete",
						style: "destructive",
						onPress: async () => {
							const success = await deleteCategory(category.id);
							if (!success) {
								Alert.alert(
									"Error",
									"Failed to delete category."
								);
							}
						},
					},
				]
			);
		},
		[deleteCategory, categoryCounts]
	);

	const renderTypeSelector = () => (
		<View style={styles.typeSelectorContainer}>
			<View style={styles.typeGrid}>
				{categories.map((category) =>
					editingCategories ? (
						<DynamicCategoryCard
							key={category.id}
							category={category}
							count={categoryCounts[category.id] || 0}
							onPress={() => handleTypeSelect(category)}
							onEdit={() => handleEditCategory(category)}
							onDelete={() => handleDeleteCategory(category)}
							showActions={true}
							customStyle={{
								marginBottom: spacing.md,
							}}
						/>
					) : (
						<TouchableOpacity
							key={category.id}
							style={styles.typeCard}
							onPress={() => handleTypeSelect(category)}
							activeOpacity={0.85}
						>
							<LinearGradient
								colors={[
									category.color.gradientStart,
									category.color.gradientEnd,
								]}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 1 }}
								style={styles.typeCardGradient}
							>
								<View style={styles.typeCardDecor} />
								<View style={styles.typeIconContainer}>
									<Ionicons
										name={category.icon as any}
										size={28}
										color="rgba(255,255,255,0.95)"
									/>
								</View>
								<ThemedText
									variant="label"
									style={styles.typeLabel}
								>
									{category.label}
								</ThemedText>
							</LinearGradient>
						</TouchableOpacity>
					)
				)}
				<TouchableOpacity
					style={[
						styles.createCategoryCard,
						styles.typeCard,
						{
							borderColor: colors.border,
							backgroundColor: colors.card,
						},
					]}
					onPress={handleCreateCategory}
					activeOpacity={0.7}
				>
					<View
						style={[
							styles.createCategoryIcon,
							{
								backgroundColor: colors.primary + "15",
							},
						]}
					>
						<Ionicons
							name="add-circle"
							size={32}
							color={colors.primary}
						/>
					</View>
					<View style={{ alignItems: "center" }}>
						<ThemedText
							variant="subtitle"
							style={[
								styles.createCategoryLabel,
								{ color: colors.primary },
							]}
						>
							New Category
						</ThemedText>
						<ThemedText
							variant="caption"
							color="tertiary"
							style={{ marginTop: spacing.xs }}
						>
							Tap to create
						</ThemedText>
					</View>
				</TouchableOpacity>
			</View>
		</View>
	);

	const renderField = (fieldDef: FieldDefinition) => {
		const value = fields[fieldDef.key] || "";
		const error = errors[fieldDef.key];

		// Render select for fields with options
		if (fieldDef.options) {
			return (
				<Select
					key={fieldDef.key}
					label={fieldDef.label + (fieldDef.required ? " *" : "")}
					value={value}
					options={fieldDef.options}
					onValueChange={(val) =>
						handleFieldChange(fieldDef.key, val)
					}
					placeholder={
						fieldDef.placeholder ||
						`Select ${fieldDef.label.toLowerCase()}`
					}
					error={error}
				/>
			);
		}

		return (
			<Input
				key={fieldDef.key}
				label={fieldDef.label + (fieldDef.required ? " *" : "")}
				value={value}
				onChangeText={(val) => handleFieldChange(fieldDef.key, val)}
				placeholder={fieldDef.placeholder}
				keyboardType={fieldDef.keyboardType}
				maxLength={fieldDef.maxLength}
				multiline={fieldDef.multiline}
				numberOfLines={fieldDef.multiline ? 4 : 1}
				sensitive={fieldDef.sensitive}
				error={error}
				autoCapitalize={fieldDef.sensitive ? "none" : "sentences"}
			/>
		);
	};

	const renderForm = () => {
		if (!selectedCategory || !categoryColor) return null;

		return (
			<View style={styles.formContainer}>
				{/* Type indicator */}
				<TouchableOpacity
					style={[styles.typeIndicator, shadows.sm]}
					onPress={() => setSelectedType(null)}
					activeOpacity={0.85}
				>
					<LinearGradient
						colors={[
							categoryColor.gradientStart,
							categoryColor.gradientEnd,
						]}
						start={{ x: 0, y: 0 }}
						end={{ x: 1, y: 0 }}
						style={styles.typeIndicatorGradient}
					>
						<View style={styles.typeIndicatorIcon}>
							<Ionicons
								name={selectedCategory.icon as any}
								size={20}
								color="rgba(255,255,255,0.95)"
							/>
						</View>
						<ThemedText
							variant="label"
							style={styles.typeIndicatorLabel}
						>
							{selectedCategory.label}
						</ThemedText>
						<View style={styles.changeTypeButton}>
							<ThemedText
								variant="caption"
								style={styles.changeTypeText}
							>
								Change
							</ThemedText>
						</View>
					</LinearGradient>
				</TouchableOpacity>

				{/* Label field */}
				<Input
					label="Label *"
					value={label}
					onChangeText={(val) => {
						setLabel(sanitizeInput(val));
						if (errors.label) {
							setErrors((prev) => {
								const newErrors = { ...prev };
								delete newErrors.label;
								return newErrors;
							});
						}
					}}
					placeholder="Give this item a name"
					error={errors.label}
				/>

				{/* Dynamic fields from category */}
				{selectedCategory.fields.map(renderField)}

				{/* Custom fields section */}
				<CustomFieldEditor
					customFields={customFields}
					onCustomFieldsChange={setCustomFields}
				/>

				{/* Asset attachments (images, PDFs, documents) */}
				<AssetPicker
					assetRefs={assetRefs}
					onAssetRefsChange={setAssetRefs}
				/>

				{/* Save button */}
				<View style={styles.saveContainer}>
					<Button
						title={isSaving ? "Saving..." : "Save Item"}
						onPress={handleSave}
						icon="checkmark"
						fullWidth
						size="lg"
						loading={isSaving}
						disabled={isSaving}
					/>
				</View>
			</View>
		);
	};

	return (
		<ThemedView style={styles.container}>
			<Stack.Screen
				options={{
					headerShown: false,
				}}
			/>

			{/* Header */}
			<LinearGradient
				colors={[colors.headerGradientStart, colors.headerGradientEnd]}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
				style={[styles.header, { paddingTop: insets.top + spacing.md }]}
			>
				<View style={styles.headerContent}>
					<TouchableOpacity
						style={styles.closeButton}
						onPress={() => router.back()}
						activeOpacity={0.7}
					>
						<Ionicons
							name="chevron-back-outline"
							size={24}
							color="#FFFFFF"
						/>
					</TouchableOpacity>
					<ThemedText variant="subtitle" style={styles.headerTitle}>
						{mode === "asset"
							? "Add Asset"
							: selectedType
							? `Add ${selectedCategory?.label}`
							: "Add Item"}
					</ThemedText>
					<TouchableOpacity
						style={styles.closeButton}
						onPress={() => setEditingCategories((v) => !v)}
						activeOpacity={0.7}
					>
						<Ionicons
							name={editingCategories ? "close" : "pencil"}
							size={24}
							color="#FFFFFF"
						/>
					</TouchableOpacity>
				</View>
			</LinearGradient>

			<KeyboardAvoidingView
				style={styles.keyboardAvoid}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
				keyboardVerticalOffset={0}
			>
				<View
					style={[
						styles.mainContent,
						{ backgroundColor: colors.background },
					]}
				>
					<ScrollView
						style={styles.scrollView}
						contentContainerStyle={styles.content}
						showsVerticalScrollIndicator={false}
						keyboardShouldPersistTaps="handled"
					>
						{mode === "asset"
							? renderAssetUploader()
							: !selectedType
							? renderTypeSelector()
							: renderForm()}
					</ScrollView>
				</View>
			</KeyboardAvoidingView>
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		paddingBottom: spacing.lg,
		paddingHorizontal: spacing.base,
	},
	headerContent: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	closeButton: {
		width: 40,
		height: 40,
		borderRadius: borderRadius.md,
		backgroundColor: "rgba(255, 255, 255, 0.15)",
		alignItems: "center",
		justifyContent: "center",
	},
	headerTitle: {
		color: "#FFFFFF",
		fontWeight: "600",
	},
	headerSpacer: {
		width: 40,
	},
	keyboardAvoid: {
		flex: 1,
	},
	mainContent: {
		flex: 1,
		marginTop: -spacing.md,
		borderTopLeftRadius: borderRadius.xl,
		borderTopRightRadius: borderRadius.xl,
	},
	scrollView: {
		flex: 1,
	},
	content: {
		padding: spacing.base,
		paddingTop: spacing.lg,
		paddingBottom: spacing["3xl"],
	},
	typeSelectorContainer: {
		paddingTop: spacing.md,
	},
	sectionTitle: {
		marginBottom: spacing.lg,
		textAlign: "center",
	},
	typeGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "space-between",
	},
	typeCard: {
		width: "48%",
		aspectRatio: 1.2,
		borderRadius: borderRadius.xl,
		marginBottom: spacing.md,
		overflow: "hidden",
	},
	typeCardGradient: {
		flex: 1,
		padding: spacing.lg,
		position: "relative",
	},
	typeCardDecor: {
		position: "absolute",
		top: -20,
		right: -20,
		width: 80,
		height: 80,
		borderRadius: 40,
		backgroundColor: "rgba(255, 255, 255, 0.1)",
	},
	typeIconContainer: {
		width: 56,
		height: 56,
		borderRadius: borderRadius.lg,
		backgroundColor: "rgba(255, 255, 255, 0.2)",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: spacing.md,
	},
	typeLabel: {
		color: "#FFFFFF",
		fontWeight: "600",
		position: "absolute",
		bottom: spacing.lg,
		left: spacing.lg,
	},
	createCategoryCard: {
		padding: spacing.lg,
		borderWidth: 2,
		borderStyle: "dashed",
		borderRadius: borderRadius.xl,
		alignItems: "center",
		justifyContent: "center",
	},
	createCategoryIcon: {
		width: 56,
		height: 56,
		borderRadius: borderRadius.lg,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: spacing.md,
	},
	createCategoryLabel: {
		fontWeight: "600",
	},
	formContainer: {
		paddingTop: spacing.sm,
	},
	typeIndicator: {
		borderRadius: borderRadius.xl,
		marginBottom: spacing.lg,
		overflow: "hidden",
	},
	typeIndicatorGradient: {
		flexDirection: "row",
		alignItems: "center",
		padding: spacing.md,
	},
	typeIndicatorIcon: {
		width: 40,
		height: 40,
		borderRadius: borderRadius.md,
		backgroundColor: "rgba(255, 255, 255, 0.2)",
		alignItems: "center",
		justifyContent: "center",
		marginRight: spacing.md,
	},
	typeIndicatorLabel: {
		color: "#FFFFFF",
		fontWeight: "600",
		flex: 1,
	},
	changeTypeButton: {
		backgroundColor: "rgba(255, 255, 255, 0.2)",
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.xs,
		borderRadius: borderRadius.sm,
	},
	changeTypeText: {
		color: "#FFFFFF",
		fontWeight: "500",
	},
	saveContainer: {
		marginTop: spacing.lg,
	},
	// Asset uploader styles
	assetUploaderContainer: {
		paddingTop: spacing.lg,
	},
	assetUploaderHeader: {
		alignItems: "center",
		marginBottom: spacing.xl,
	},
	assetUploaderIconContainer: {
		width: 100,
		height: 100,
		borderRadius: 50,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: spacing.md,
	},
	assetUploaderTitle: {
		marginBottom: spacing.xs,
		textAlign: "center",
	},
	assetUploaderSubtitle: {
		textAlign: "center",
		paddingHorizontal: spacing.xl,
	},
	assetUploadOptions: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: spacing.xl,
	},
	assetUploadOption: {
		flex: 1,
		alignItems: "center",
		padding: spacing.md,
		borderRadius: borderRadius.lg,
		borderWidth: 1,
		marginHorizontal: spacing.xs,
	},
	assetUploadOptionIcon: {
		width: 56,
		height: 56,
		borderRadius: borderRadius.lg,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: spacing.sm,
	},
	uploadedAssetsSection: {
		marginTop: spacing.md,
	},
	uploadedAssetsTitle: {
		marginBottom: spacing.md,
	},
	uploadedAssetsList: {
		gap: spacing.sm,
	},
	uploadedAssetItem: {
		flexDirection: "row",
		alignItems: "center",
		padding: spacing.md,
		borderRadius: borderRadius.lg,
		borderWidth: 1,
		marginBottom: spacing.sm,
	},
	uploadedAssetThumbnail: {
		width: 48,
		height: 48,
		borderRadius: borderRadius.md,
	},
	uploadedAssetDocIcon: {
		width: 48,
		height: 48,
		borderRadius: borderRadius.md,
		alignItems: "center",
		justifyContent: "center",
	},
	uploadedAssetInfo: {
		flex: 1,
		marginLeft: spacing.md,
	},
	uploadingIndicator: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		padding: spacing.md,
	},
});
