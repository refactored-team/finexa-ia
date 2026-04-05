package services

import (
	"context"
	"database/sql"
	"errors"

	"finexa-ia/ms-users/internal/models"
	"finexa-ia/ms-users/internal/repository"
)

var (
	ErrInvalidUserID    = errors.New("invalid user id")
	ErrInvalidUserInput = errors.New("invalid user input")
	ErrUserNotFound     = errors.New("user not found")
)

type UserService struct {
	repo *repository.UserRepository
}

func NewUserService(repo *repository.UserRepository) *UserService {
	return &UserService{repo: repo}
}

func (s *UserService) GetUser(ctx context.Context, id int64) (models.User, error) {
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

func (s *UserService) ListUsers(ctx context.Context) ([]models.User, error) {
	return s.repo.List(ctx)
}

type CreateUserInput struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

func (s *UserService) CreateUser(ctx context.Context, in CreateUserInput) (models.User, error) {
	if in.Name == "" || in.Email == "" {
		return models.User{}, ErrInvalidUserInput
	}
	return s.repo.Create(ctx, in.Name, in.Email)
}

type UpdateUserInput struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

func (s *UserService) UpdateUser(ctx context.Context, id int64, in UpdateUserInput) (models.User, error) {
	if id <= 0 {
		return models.User{}, ErrInvalidUserID
	}
	if in.Name == "" || in.Email == "" {
		return models.User{}, ErrInvalidUserInput
	}
	out, err := s.repo.Update(ctx, id, in.Name, in.Email)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return models.User{}, ErrUserNotFound
		}
		return models.User{}, err
	}
	return out, nil
}

func (s *UserService) DeleteUser(ctx context.Context, id int64) (models.User, error) {
	if id <= 0 {
		return models.User{}, ErrInvalidUserID
	}
	out, err := s.repo.Delete(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return models.User{}, ErrUserNotFound
		}
		return models.User{}, err
	}
	return out, nil
}
