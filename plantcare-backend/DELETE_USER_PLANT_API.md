# Delete User Plant API

## Overview
This API allows users to delete plants from their personal collection. Users can only delete plants that belong to them.

## Endpoint
```
DELETE /api/user-plants/{userPlantId}
```

## Authentication
- **Required**: Bearer token in Authorization header
- **Format**: `Authorization: Bearer <jwt_token>`

## Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userPlantId | Long | Yes | The ID of the user plant to delete |

## Request Example
```bash
curl -X DELETE \
  http://localhost:8080/api/user-plants/1 \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json'
```

## Response

### Success Response (200 OK)
```json
{
  "status": 200,
  "message": "Plant successfully removed from collection",
  "data": {
    "status": 200,
    "message": "Plant deleted successfully"
  }
}
```

### Error Responses

#### 401 Unauthorized
```json
{
  "status": 401,
  "message": "User not authenticated"
}
```

#### 404 Not Found
```json
{
  "status": 404,
  "message": "User plant not found or you don't have permission to delete it"
}
```

#### 400 Bad Request
```json
{
  "status": 400,
  "message": "Failed to delete plant from collection"
}
```

## Security Features
1. **Authentication Required**: Users must be authenticated with a valid JWT token
2. **Authorization**: Users can only delete plants that belong to them
3. **Ownership Validation**: The system verifies that the userPlantId belongs to the authenticated user

## Business Logic
1. Extract user ID from JWT token
2. Validate that the user plant exists and belongs to the authenticated user
3. Delete the user plant from the database
4. Return success response

## Database Changes
- No schema changes required
- Uses existing `user_plants` table
- Deletes the specific user plant record

## Error Handling
- **ResourceNotFoundException**: Thrown when user plant is not found or doesn't belong to the user
- **Authentication Errors**: Handled when JWT token is invalid or missing
- **General Exceptions**: Caught and returned as 400 Bad Request

## Testing
Unit tests are included in `UserPlantsServiceTest.java` covering:
- Successful deletion
- Plant not found scenarios
- Wrong user access attempts

## Internationalization
Messages are internationalized using the `Translator` utility:
- `userplant.delete.success`: Success message
- `userplant.delete.failed`: Failure message  
- `userplant.not.found`: Not found message 