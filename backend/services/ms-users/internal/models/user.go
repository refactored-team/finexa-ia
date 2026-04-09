package models

import "time"

// User is the public shape for API responses (no internal secrets).
type User struct {
	ID          int64      `json:"id"`
	CognitoSub  string     `json:"cognito_sub"`
	Email       *string    `json:"email,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	DeletedAt   *time.Time `json:"deleted_at,omitempty"`
}

// UpsertUserRequest is the JSON body for POST /v1/users.
type UpsertUserRequest struct {
	CognitoSub string  `json:"cognito_sub" example:"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"`
	Email      *string `json:"email,omitempty" example:"jane@example.com"`
}

// UpdateUserRequest is the JSON body for PUT /v1/users/{id}.
type UpdateUserRequest struct {
	CognitoSub string  `json:"cognito_sub" example:"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"`
	Email      *string `json:"email,omitempty" example:"jane@example.com"`
}

// PatchUserEmailRequest is the JSON body for PATCH /v1/users/{id} (solo email).
type PatchUserEmailRequest struct {
	Email *string `json:"email" example:"jane@example.com"`
}

// UserOKResult is the success envelope for a single user.
type UserOKResult struct {
	OK   bool `json:"ok"`
	Data User `json:"data"`
}

// UserListPage is a paginated list of users (GET /v1/users).
type UserListPage struct {
	Items  []User `json:"items"`
	Limit  int    `json:"limit"`
	Offset int    `json:"offset"`
	Total  int64  `json:"total"`
}

// UserListPageOKResult is the success envelope for GET /v1/users.
type UserListPageOKResult struct {
	OK   bool         `json:"ok"`
	Data UserListPage `json:"data"`
}

// UserListOKResult is the success envelope for GET /v1/users/all (todos los activos).
type UserListOKResult struct {
	OK   bool   `json:"ok"`
	Data []User `json:"data"`
}
