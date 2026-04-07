package repository

import (
	"context"
	"database/sql"
	"strings"

	"finexa-ia/ms-users/internal/models"
	"finexa-ia/ms-users/internal/repository/sqlcgen"
)

type UserRepository struct {
	q *sqlcgen.Queries
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{q: sqlcgen.New(db)}
}

func (r *UserRepository) UpsertByCognitoSub(ctx context.Context, cognitoSub string, email *string) (models.User, error) {
	u, err := r.q.UpsertUserByCognitoSub(ctx, sqlcgen.UpsertUserByCognitoSubParams{
		CognitoSub: strings.TrimSpace(cognitoSub),
		Email:      stringPtrToNull(email),
	})
	if err != nil {
		return models.User{}, err
	}
	return toModel(u), nil
}

func (r *UserRepository) GetByID(ctx context.Context, id int64) (models.User, error) {
	u, err := r.q.GetUserByID(ctx, id)
	if err != nil {
		return models.User{}, err
	}
	return toModel(u), nil
}

func (r *UserRepository) GetByCognitoSub(ctx context.Context, cognitoSub string) (models.User, error) {
	u, err := r.q.GetUserByCognitoSub(ctx, strings.TrimSpace(cognitoSub))
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

func (r *UserRepository) UpdateByID(ctx context.Context, id int64, cognitoSub string, email *string) (models.User, error) {
	u, err := r.q.UpdateUserByID(ctx, sqlcgen.UpdateUserByIDParams{
		CognitoSub: strings.TrimSpace(cognitoSub),
		Email:      stringPtrToNull(email),
		ID:         id,
	})
	if err != nil {
		return models.User{}, err
	}
	return toModel(u), nil
}

func (r *UserRepository) DeleteByID(ctx context.Context, id int64) (models.User, error) {
	u, err := r.q.DeleteUserByID(ctx, id)
	if err != nil {
		return models.User{}, err
	}
	return toModel(u), nil
}

func stringPtrToNull(p *string) sql.NullString {
	if p == nil {
		return sql.NullString{}
	}
	s := strings.TrimSpace(*p)
	if s == "" {
		return sql.NullString{}
	}
	return sql.NullString{String: s, Valid: true}
}

func toModel(u sqlcgen.User) models.User {
	out := models.User{
		ID:         u.ID,
		CognitoSub: u.CognitoSub,
		CreatedAt:  u.CreatedAt,
		UpdatedAt:  u.UpdatedAt,
	}
	if u.Email.Valid {
		s := u.Email.String
		out.Email = &s
	}
	return out
}
