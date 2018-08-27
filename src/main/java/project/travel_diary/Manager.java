package project.travel_diary;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;

import lombok.Data;
import lombok.ToString;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.fasterxml.jackson.annotation.JsonIgnore;
/**
 * Created by maciejmarzeta on 25.08.2018.
 */
@Data
@ToString(exclude = "password")
@Entity
public class Manager {

    public static final PasswordEncoder PASSWORD_ENCODER = new BCryptPasswordEncoder();

    private @Id @GeneratedValue Long id;

    private String name;

    private @JsonIgnore String password;

    private String[] roles;

    public void setPassword(String password) {
        this.password = PASSWORD_ENCODER.encode(password);
    }

    protected Manager() {}

    public Manager(String name, String password, String... roles) {

        this.name = name;
        this.setPassword(password);
        this.roles = roles;
    }

    public String getName(){
        return this.name;
    }

    public String[] getRoles(){
        return this.roles;
    }

    public String getPassword(){
        return this.password;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setRoles(String[] roles) {
        this.roles = roles;
    }
}