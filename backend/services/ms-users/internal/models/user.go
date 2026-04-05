package models

type User struct {
	ID        int64  `json:"id"`
	Name      string `json:"name"`
	Email     string `json:"email"`
	CreatedAt string `json:"created_at"`
}

// CreateUserRequest is the JSON body for POST /users.
type CreateUserRequest struct {
	Name  string `json:"name" example:"Jane"`
	Email string `json:"email" example:"jane@example.com"`
}

// UpdateUserRequest is the JSON body for PUT /users/{id}.
type UpdateUserRequest struct {
	Name  string `json:"name" example:"Jane"`
	Email string `json:"email" example:"jane@example.com"`
}

// UserOKResult is the success envelope for a single user (GET/POST/PUT/DELETE /users…).
type UserOKResult struct {
	OK   bool `json:"ok"`
	Data User `json:"data"`
}

// UserListOKResult is the success envelope for GET /users.
type UserListOKResult struct {
	OK   bool   `json:"ok"`
	Data []User `json:"data"`
}
