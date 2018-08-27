package project.travel_diary;

import org.springframework.data.repository.Repository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

/**
 * Created by maciejmarzeta on 25.08.2018.
 */
@RepositoryRestResource(exported = false)
public interface ManagerRepository extends Repository<Manager, Long> {

    Manager save(Manager manager);

    Manager findByName(String name);

}