-- Add startWeightLbs column to track weight when goal was created
ALTER TABLE `user_profiles` ADD COLUMN `startWeightLbs` int NULL;

-- Set startWeightLbs to current weightLbs for existing profiles with goals
UPDATE `user_profiles` SET `startWeightLbs` = `weightLbs` WHERE `goalWeightLbs` IS NOT NULL AND `startWeightLbs` IS NULL;
