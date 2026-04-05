package models

import "time"

// User is the public shape for API responses (no internal secrets).
type User struct {
	ID          int64      `json:"id"`
	CognitoSub  string     `json:"cognito_sub"`
	Email       *string    `json:"email,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// UpsertUserRequest is the JSON body for POST /v1/users.
type UpsertUserRequest struct {
	CognitoSub string  `json:"cognito_sub" example:"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"`
	Email      *string `json:"email,omitempty" example:"jane@example.com"`
}

// UserOKResult is the success envelope for a single user.
type UserOKResult struct {
	OK   bool `json:"ok"`
	Data User `json:"data"`
}
