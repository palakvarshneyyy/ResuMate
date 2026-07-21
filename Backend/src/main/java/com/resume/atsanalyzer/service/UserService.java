package com.resume.atsanalyzer.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.resume.atsanalyzer.dto.LoginRequest;
import com.resume.atsanalyzer.dto.SignupRequest;
import com.resume.atsanalyzer.model.User;
import com.resume.atsanalyzer.repository.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // Signup
    public String registerUser(SignupRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            return "Email already registered!";
        }

        User user = new User();

        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        userRepository.save(user);

        return "User registered successfully!";
    }

    // Login
    public String loginUser(LoginRequest request) {

        User user = userRepository.findByEmail(request.getEmail()).orElse(null);

        if (user == null) {
            return "Invalid email or password!";
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return "Invalid email or password!";
        }

        return "Login Successful!";
    }
}