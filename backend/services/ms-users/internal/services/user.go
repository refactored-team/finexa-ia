package services

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"finexa-ia/ms-users/internal/models"
	"finexa-ia/ms-users/internal/pgerr"
	"finexa-ia/ms-users/internal/repository"
)

const (
	defaultListLimit = 50
	maxListLimit     = 200
)

var (
	ErrInvalidUserID      = errors.New("invalid user id")
	ErrInvalidUserInput   = errors.New("cognito_sub is required")
	ErrUserNotFound       = errors.New("user not found")
	ErrCognitoSubMissing  = errors.New("cognito_sub query parameter is required")
	ErrEmailQueryMissing  = errors.New("email query parameter is required")
	ErrConflict           = errors.New("resource conflict")
	ErrInvalidListParams  = errors.New("invalid list parameters")
	ErrInvalidTimeRange   = errors.New("created_from must be before or equal to created_to")
)

type UserService struct {
	repo *repository.UserRepository
}

func NewUserService(repo *repository.UserRepository) *UserService {
	return &UserService{repo: repo}
}

func (s *UserService) Upsert(ctx context.Context, in models.UpsertUserRequest) (models.User, error) {
	if strings.TrimSpace(in.CognitoSub) == "" {
		return models.User{}, ErrInvalidUserInput
	}
	out, err := s.repo.UpsertByCognitoSub(ctx, in.CognitoSub, in.Email)
	if err != nil {
		if pgerr.IsUniqueViolation(err) {
			return models.User{}, ErrConflict
		}
		return models.User{}, err
	}
	return out, nil
}

func (s *UserService) GetByID(ctx context.Context, id int64) (models.User, error) {
	if id <= 0 {
		return models.User{}, ErrInvalidUserID
	}
	out, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return models.User{}, ErrUserNotFound
		}
		return models.User{}, err
	}
	return out, nil
}

func (s *UserService) GetByCognitoSub(ctx context.Context, cognitoSub string) (models.User, error) {
	if strings.TrimSpace(cognitoSub) == "" {
		return models.User{}, ErrCognitoSubMissing
	}
	out, err := s.repo.GetByCognitoSub(ctx, cognitoSub)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return models.User{}, ErrUserNotFound
		}
		return models.User{}, err
	}
	return out, nil
}

func (s *UserService) GetByEmail(ctx context.Context, email string) (models.User, error) {
	if strings.TrimSpace(email) == "" {
		return models.User{}, ErrEmailQueryMissing
	}
	out, err := s.repo.GetByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return models.User{}, ErrUserNotFound
		}
		return models.User{}, err
	}
	return out, nil
}

// ListUsersQuery holds validated query params for GET /v1/users.
type ListUsersQuery struct {
	Limit          int
	Offset         int
	IncludeDeleted bool
	FilterEmail    string
	CreatedFrom    *time.Time
	CreatedTo      *time.Time
}

func (s *UserService) ListAll(ctx context.Context) ([]models.User, error) {
	return s.repo.ListAllActive(ctx)
}

func (s *UserService) List(ctx context.Context, q ListUsersQuery) (models.UserListPage, error) {
	limit := q.Limit
	if limit <= 0 {
		limit = defaultListLimit
	}
	if limit > maxListLimit {
		return models.UserListPage{}, fmt.Errorf("%w: limit max %d", ErrInvalidListParams, maxListLimit)
	}
	if q.Offset < 0 {
		return models.UserListPage{}, fmt.Errorf("%w: offset must be >= 0", ErrInvalidListParams)
	}
	if q.CreatedFrom != nil && q.CreatedTo != nil && q.CreatedFrom.After(*q.CreatedTo) {
		return models.UserListPage{}, ErrInvalidTimeRange
	}

	items, total, err := s.repo.ListFiltered(ctx, repository.ListUsersParams{
		IncludeDeleted: q.IncludeDeleted,
		FilterEmail:    q.FilterEmail,
		CreatedFrom:    q.CreatedFrom,
		CreatedTo:      q.CreatedTo,
		Limit:          int32(limit),
		Offset:         int32(q.Offset),
	})
	if err != nil {
		return models.UserListPage{}, err
	}
	return models.UserListPage{
		Items:  items,
		Limit:  limit,
		Offset: q.Offset,
		Total:  total,
	}, nil
}

func (s *UserService) UpdateByID(ctx context.Context, id int64, in models.UpdateUserRequest) (models.User, error) {
	if id <= 0 {
		return models.User{}, ErrInvalidUserID
	}
	if strings.TrimSpace(in.CognitoSub) == "" {
		return models.User{}, ErrInvalidUserInput
	}
	out, err := s.repo.UpdateByID(ctx, id, in.CognitoSub, in.Email)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return models.User{}, ErrUserNotFound
		}
		if pgerr.IsUniqueViolation(err) {
			return models.User{}, ErrConflict
		}
		return models.User{}, err
	}
	return out, nil
}

func (s *UserService) PatchEmailByID(ctx context.Context, id int64, in models.PatchUserEmailRequest) (models.User, error) {
	if id <= 0 {
		return models.User{}, ErrInvalidUserID
	}
	out, err := s.repo.PatchEmailByID(ctx, id, in.Email)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return models.User{}, ErrUserNotFound
		}
		if pgerr.IsUniqueViolation(err) {
			return models.User{}, ErrConflict
		}
		return models.User{}, err
	}
	return out, nil
}

func (s *UserService) DeleteByID(ctx context.Context, id int64) (models.User, error) {
	if id <= 0 {
		return models.User{}, ErrInvalidUserID
	}
	out, err := s.repo.DeleteByID(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return models.User{}, ErrUserNotFound
		}
		return models.User{}, err
	}
	return out, nil
}

func (s *UserService) RestoreByID(ctx context.Context, id int64) (models.User, error) {
	if id <= 0 {
		return models.User{}, ErrInvalidUserID
	}
	out, err := s.repo.RestoreByID(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return models.User{}, ErrUserNotFound
		}
		if pgerr.IsUniqueViolation(err) {
			return models.User{}, ErrConflict
		}
		return models.User{}, err
	}
	return out, nil
}

func (s *UserService) HardDeleteByID(ctx context.Context, id int64) (models.User, error) {
	if id <= 0 {
		return models.User{}, ErrInvalidUserID
	}
	out, err := s.repo.HardDeleteByID(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return models.User{}, ErrUserNotFound
		}
		return models.User{}, err
	}
	return out, nil
}
