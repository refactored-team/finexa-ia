package services

import (
	"context"
	"database/sql"
	"errors"
	"strings"

	"finexa-ia/ms-users/internal/models"
	"finexa-ia/ms-users/internal/repository"
)

var (
	ErrInvalidUserID     = errors.New("invalid user id")
	ErrInvalidUserInput  = errors.New("cognito_sub is required")
	ErrUserNotFound      = errors.New("user not found")
	ErrCognitoSubMissing = errors.New("cognito_sub query parameter is required")
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
	return s.repo.UpsertByCognitoSub(ctx, in.CognitoSub, in.Email)
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
