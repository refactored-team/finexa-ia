package repository

import (
	"context"
	"database/sql"

	"finexa-ia/service-c/internal/models"
	"finexa-ia/service-c/internal/repository/sqlcgen"
)

type UserRepository struct {
	q *sqlcgen.Queries
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{q: sqlcgen.New(db)}
}

func (r *UserRepository) GetByID(ctx context.Context, id int64) (models.User, error) {
	u, err := r.q.GetUserByID(ctx, id)
	if err != nil {
		return models.User{}, err
	}
	return toModel(u), nil
}

func (r *UserRepository) List(ctx context.Context) ([]models.User, error) {
	rows, err := r.q.ListUsers(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]models.User, len(rows))
	for i, u := range rows {
		out[i] = toModel(u)
	}
	return out, nil
}

func (r *UserRepository) Create(ctx context.Context, name, email string) (models.User, error) {
	u, err := r.q.CreateUser(ctx, sqlcgen.CreateUserParams{Name: name, Email: email})
	if err != nil {
		return models.User{}, err
	}
	return toModel(u), nil
}

func toModel(u sqlcgen.User) models.User {
	return models.User{
		ID:        u.ID,
		Name:      u.Name,
		Email:     u.Email,
		CreatedAt: u.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}
