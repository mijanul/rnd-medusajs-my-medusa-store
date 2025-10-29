/**
 * Feature Flags Configuration
 *
 * Controls the rollout of new features, including the optimized pricing system.
 * This allows us to gradually enable features and roll back if needed.
 */

export enum FeatureFlag {
  USE_OPTIMIZED_PRICING = "use_optimized_pricing",
  USE_REGION_BASED_PRICING = "use_region_based_pricing",
  ENABLE_PROMOTION_INTEGRATION = "enable_promotion_integration",
  ENABLE_PRICE_LIST_INTEGRATION = "enable_price_list_integration",
}

interface FeatureFlagConfig {
  [key: string]: {
    enabled: boolean;
    description: string;
    rolloutPercentage?: number; // For gradual rollout (0-100)
  };
}

/**
 * Feature flag configuration
 * Toggle these to enable/disable features
 */
const featureFlags: FeatureFlagConfig = {
  [FeatureFlag.USE_OPTIMIZED_PRICING]: {
    enabled: false, // Set to true when ready to migrate
    description: "Use optimized Medusa-native pricing system",
    rolloutPercentage: 0, // Gradual rollout: 0 = disabled, 100 = all users
  },
  [FeatureFlag.USE_REGION_BASED_PRICING]: {
    enabled: false,
    description: "Use region-based pincode mapping instead of direct lookup",
    rolloutPercentage: 0,
  },
  [FeatureFlag.ENABLE_PROMOTION_INTEGRATION]: {
    enabled: false,
    description: "Enable automatic promotion application via Medusa",
    rolloutPercentage: 0,
  },
  [FeatureFlag.ENABLE_PRICE_LIST_INTEGRATION]: {
    enabled: false,
    description: "Enable automatic price list overrides via Medusa",
    rolloutPercentage: 0,
  },
};

/**
 * Check if a feature flag is enabled
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  const config = featureFlags[flag];
  if (!config) return false;

  // Simple enabled/disabled check
  if (!config.enabled) return false;

  // If rollout percentage is set, check against random value
  if (config.rolloutPercentage !== undefined) {
    const randomValue = Math.random() * 100;
    return randomValue < config.rolloutPercentage;
  }

  return true;
}

/**
 * Check if a feature is enabled for a specific user
 * This allows for user-specific rollouts (e.g., beta testers)
 */
export function isFeatureEnabledForUser(
  flag: FeatureFlag,
  userId?: string
): boolean {
  // For now, use the same logic as isFeatureEnabled
  // Later, we can add user-specific checks (e.g., beta user list)
  return isFeatureEnabled(flag);
}

/**
 * Get all feature flags with their status
 */
export function getAllFeatureFlags() {
  return Object.entries(featureFlags).map(([key, config]) => ({
    flag: key,
    enabled: config.enabled,
    description: config.description,
    rolloutPercentage: config.rolloutPercentage,
  }));
}

/**
 * Enable a feature flag (use with caution in production)
 */
export function enableFeatureFlag(flag: FeatureFlag) {
  if (featureFlags[flag]) {
    featureFlags[flag].enabled = true;
    console.log(`✅ Feature flag enabled: ${flag}`);
  }
}

/**
 * Disable a feature flag
 */
export function disableFeatureFlag(flag: FeatureFlag) {
  if (featureFlags[flag]) {
    featureFlags[flag].enabled = false;
    console.log(`❌ Feature flag disabled: ${flag}`);
  }
}

/**
 * Set rollout percentage for gradual feature rollout
 */
export function setRolloutPercentage(flag: FeatureFlag, percentage: number) {
  if (featureFlags[flag]) {
    featureFlags[flag].rolloutPercentage = Math.max(
      0,
      Math.min(100, percentage)
    );
    console.log(`📊 Feature flag ${flag} rollout set to ${percentage}%`);
  }
}

export default {
  isFeatureEnabled,
  isFeatureEnabledForUser,
  getAllFeatureFlags,
  enableFeatureFlag,
  disableFeatureFlag,
  setRolloutPercentage,
};
