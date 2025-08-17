# Plant Update Functionality

## Overview
This document describes the enhanced plant update functionality that allows users to update both their user plant details and the original plant information (if they have permission).

## Problem Solved
Previously, users could only update basic information of their user plants (nickname, planting date, location, images) but could not update the original plant details such as:
- Category
- Care difficulty
- Light requirement
- Water requirement
- Description
- Care instructions
- Suitable location
- Common diseases

## Solution
The system now allows users to update both:
1. **User Plant Details**: Basic information specific to their plant instance
2. **Original Plant Details**: General information about the plant species (only if they created the plant)

## API Endpoints

### Update User Plant
```
PUT /api/user-plants/update
```

### Update User Plant with Images
```
PUT /api/user-plants/update-with-images
```

## Request DTO Structure

```json
{
  "userPlantId": 1,
  "nickname": "My Plant",
  "plantingDate": "2024-01-01T00:00:00.000Z",
  "locationInHouse": "Living Room",
  "reminderEnabled": true,
  
  // Plant detail updates (optional)
  "categoryId": 2,
  "careDifficulty": "MODERATE",
  "lightRequirement": "MEDIUM", 
  "waterRequirement": "HIGH",
  "description": "Updated description",
  "careInstructions": "Updated care instructions",
  "suitableLocation": "Indoor, bright indirect light",
  "commonDiseases": "Root rot, leaf spots",
  
  // Image updates (optional)
  "imageUpdates": [...],
  "imageUrls": [...]
}
```

## Field Validation

### Required Fields
- `userPlantId`: Must be a valid user plant ID
- `nickname`: 1-100 characters, cannot be empty
- `plantingDate`: Cannot be in the future
- `locationInHouse`: 1-200 characters, cannot be empty

### Optional Plant Detail Fields
- `categoryId`: Must be a valid category ID
- `careDifficulty`: Must be "EASY", "MODERATE", or "DIFFICULT"
- `lightRequirement`: Must be "LOW", "MEDIUM", or "HIGH"
- `waterRequirement`: Must be "LOW", "MEDIUM", or "HIGH"
- `description`: Maximum 1000 characters
- `careInstructions`: Maximum 1000 characters
- `suitableLocation`: Maximum 500 characters
- `commonDiseases`: Maximum 500 characters

## Permission System

### User Plant Updates
- All authenticated users can update their own user plant details
- Updates include: nickname, planting date, location, reminder settings, images

### Original Plant Updates
- Users can only update original plant details if they created the plant
- Plant must have `createdBy` field matching the user's ID
- Official plants (admin-created) cannot be updated by regular users

## Response Messages

### Success Responses
- **Basic update**: "User plant updated successfully"
- **With plant details**: "User plant and plant details updated successfully"
- **With images**: "User plant updated successfully with images"
- **With both**: "User plant, plant details, and images updated successfully"

### Error Responses
- **Validation errors**: 400 Bad Request with specific validation messages
- **Not found**: 404 Not Found if user plant or plant doesn't exist
- **Permission denied**: Silent failure (no error, but plant details not updated)
- **Server errors**: 500 Internal Server Error

## Example Usage

### Update Basic Information Only
```json
{
  "userPlantId": 1,
  "nickname": "My Favorite Plant",
  "plantingDate": "2024-01-01T00:00:00.000Z",
  "locationInHouse": "Kitchen Window",
  "reminderEnabled": true
}
```

### Update Plant Details
```json
{
  "userPlantId": 1,
  "nickname": "My Favorite Plant",
  "plantingDate": "2024-01-01T00:00:00.000Z",
  "locationInHouse": "Kitchen Window",
  "reminderEnabled": true,
  "categoryId": 3,
  "careDifficulty": "EASY",
  "lightRequirement": "MEDIUM",
  "waterRequirement": "LOW",
  "description": "A beautiful indoor plant that's easy to care for",
  "careInstructions": "Water when soil feels dry, keep in bright indirect light"
}
```

## Implementation Details

### Service Layer
- `UserPlantsServiceImpl.updateUserPlant()`: Main update logic
- `updateOriginalPlantDetails()`: Handles original plant updates
- Permission checking via `plant.isUserCreatedPlant()` and `userId.equals(plant.getCreatedBy())`

### Validation
- DTO-level validation using `@Pattern` for enum fields
- Service-level validation for business logic
- Automatic validation of enum values before database operations

### Transaction Management
- All updates are wrapped in `@Transactional`
- Ensures data consistency across user plant and original plant updates

## Testing
Test cases cover:
- Successful updates with and without plant details
- Permission checking for official vs user-created plants
- Validation of all field types
- Error handling scenarios

## Security Considerations
- Users can only update their own plants
- Original plant updates require ownership verification
- Input validation prevents malicious data injection
- Enum validation ensures only valid values are accepted

