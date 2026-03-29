package services

import (
	"context"

	"finexa-ia/service-a/internal/models"
	"finexa-ia/service-a/internal/repository"
)

type UserService struct {
	repo *repository.UserRepository
}

func NewUserService(repo *repository.UserRepository) *UserService {
	return &UserService{repo: repo}
}

func (s *UserService) GetUser(ctx context.Context, id int64) (models.User, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *UserService) ListUsers(ctx context.Context) ([]models.User, error) {
	return s.repo.List(ctx)
}

type CreateUserInput struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

func (s *UserService) CreateUser(ctx context.Context, in CreateUserInput) (models.User, error) {
	return s.repo.Create(ctx, in.Name, in.Email)
}
