package repository

import (
	"context"
	"database/sql"
	"strings"
	"time"

	"finexa-ia/ms-users/internal/models"
	"finexa-ia/ms-users/internal/repository/sqlcgen"
)

type UserRepository struct {
	q *sqlcgen.Queries
}

// ListUsersParams filters and pagination for listing users.
type ListUsersParams struct {
	IncludeDeleted bool
	FilterEmail    string
	CreatedFrom    *time.Time
	CreatedTo      *time.Time
	Limit          int32
	Offset         int32
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

func (r *UserRepository) GetByEmail(ctx context.Context, email string) (models.User, error) {
	u, err := r.q.GetUserByEmail(ctx, strings.TrimSpace(email))
	if err != nil {
		return models.User{}, err
	}
	return toModel(u), nil
}

func (r *UserRepository) ListAllActive(ctx context.Context) ([]models.User, error) {
	rows, err := r.q.ListAllActiveUsers(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]models.User, len(rows))
	for i, u := range rows {
		out[i] = toModel(u)
	}
	return out, nil
}

func (r *UserRepository) ListFiltered(ctx context.Context, p ListUsersParams) ([]models.User, int64, error) {
	arg := sqlcgen.ListUsersFilteredParams{
		IncludeDeleted: p.IncludeDeleted,
		FilterEmail:    strings.TrimSpace(p.FilterEmail),
		Limit:          p.Limit,
		Offset:         p.Offset,
	}
	arg.CreatedFrom = timePtrToNull(p.CreatedFrom)
	arg.CreatedTo = timePtrToNull(p.CreatedTo)

	countArg := sqlcgen.CountUsersFilteredParams{
		IncludeDeleted: p.IncludeDeleted,
		FilterEmail:    strings.TrimSpace(p.FilterEmail),
		CreatedFrom:    arg.CreatedFrom,
		CreatedTo:      arg.CreatedTo,
	}
	total, err := r.q.CountUsersFiltered(ctx, countArg)
	if err != nil {
		return nil, 0, err
	}
	rows, err := r.q.ListUsersFiltered(ctx, arg)
	if err != nil {
		return nil, 0, err
	}
	out := make([]models.User, len(rows))
	for i, u := range rows {
		out[i] = toModel(u)
	}
	return out, total, nil
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

func (r *UserRepository) PatchEmailByID(ctx context.Context, id int64, email *string) (models.User, error) {
	u, err := r.q.PatchUserEmailByID(ctx, sqlcgen.PatchUserEmailByIDParams{
		Email: stringPtrToNull(email),
		ID:    id,
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

func (r *UserRepository) RestoreByID(ctx context.Context, id int64) (models.User, error) {
	u, err := r.q.RestoreUserByID(ctx, id)
	if err != nil {
		return models.User{}, err
	}
	return toModel(u), nil
}

func (r *UserRepository) HardDeleteByID(ctx context.Context, id int64) (models.User, error) {
	u, err := r.q.HardDeleteUserByID(ctx, id)
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

func timePtrToNull(t *time.Time) sql.NullTime {
	if t == nil {
		return sql.NullTime{}
	}
	return sql.NullTime{Time: *t, Valid: true}
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
	if u.DeletedAt.Valid {
		t := u.DeletedAt.Time
		out.DeletedAt = &t
	}
	return out
}
